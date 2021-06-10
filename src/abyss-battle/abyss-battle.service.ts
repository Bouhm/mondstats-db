import _ from 'lodash';
import { Model } from 'mongoose';
import { Character, CharacterDocument } from 'src/character/character.model';
import { PlayerCharacterDocument } from 'src/player-character/player-character.model';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument, AbyssStats } from './abyss-battle.model';

const _compareFloor = (f1: AbyssStats, f2: AbyssStats) => {
  const f1Strs = f1.floor_level.split('-');
  const f2Strs = f2.floor_level.split('-');

  if (parseInt(f1Strs[0]) === parseInt(f2Strs[0])) {
    return parseInt(f1Strs[1]) - parseInt(f2Strs[1]);
  } else {
    return parseInt(f1Strs[0]) - parseInt(f2Strs[0]);
  }
};

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,

    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) {}

  async list(filter: ListAbyssBattleInput) {
    const queryFilter = {};

    if (filter) {
      const { floorLevels, charIds } = filter;
      if (floorLevels && floorLevels.length > 0) {
        queryFilter['floor_level'] = { $in: floorLevels };
      }

      if (charIds && charIds.length > 0) {
        const _ids = _.map(await this.characterModel.find({ oid: { $in: charIds } }), (char) => char._id);
        queryFilter['party'] = {
          $not: {
            $elemMatch: {
              $nin: _ids,
            },
          },
        };
      }
    }

    return this.abyssBattleModel
      .find(queryFilter)
      .populate({
        path: 'party',
        select: 'oid -_id',
      })
      .exec();
  }

  async aggregate(filter: ListAbyssBattleInput) {
    const battleIndices = 2;
    const abyssData: AbyssStats[] = [];
    const battles = await this.list(filter);

    _.forEach(battles, ({ floor_level, battle_index, party }) => {
      const floorIdx = _.findIndex(abyssData, { floor_level });

      if (floorIdx > -1) {
        const partyData = abyssData[floorIdx]['party_stats'];
        const oids = _.map(
          party,
          (char: PlayerCharacterDocument) => char.oid,
        ).sort() as unknown as number[];

        const partyIdx = _.findIndex(
          partyData[battle_index - 1],
          (battle: { party: number[]; count: number }) => _.isEqual(battle.party, oids),
        );

        if (partyIdx > -1) {
          partyData[battle_index - 1][partyIdx].count++;
        } else {
          if (partyData.length) {
            partyData[battle_index - 1].push({
              party: oids,
              count: 1,
            });
          } else {
            partyData[battle_index - 1] = [
              {
                party: oids,
                count: 1,
              },
            ];
          }
        }
      } else {
        abyssData.push({
          party_stats: new Array(battleIndices).fill([]),
          floor_level,
        });
      }
    });

    _.forEach(abyssData, ({ party_stats }) => {
      _.forEach(party_stats, (battle, i) => {
        party_stats[i] = _.take(_.sortBy(battle, 'count'), 20);
      });
    });

    return abyssData.sort(_compareFloor);
  }
}
