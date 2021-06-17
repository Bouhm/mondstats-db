import _ from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Character, CharacterDocument } from '../character/character.model';
import { PlayerCharacterDocument } from '../player-character/player-character.model';
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
    const queryMatch = {};

    if (filter) {
      const { floorLevels, charIds, f2p } = filter;
      if (floorLevels && floorLevels.length > 0) {
        queryFilter['floor_level'] = { $in: floorLevels };
      }

      // if (charIds && charIds.length > 0) {
      //   const _ids = _.map(await this.characterModel.find({ oid: { $in: charIds } }), (char) => char._id);
      //   queryFilter['party'] = {
      //     $not: {
      //       $elemMatch: {
      //         $nin: _ids,
      //       },
      //     },
      //   };
      // }

      // if (f2p) {
      //   queryMatch['rarity'] = { $lt: 5 };
      // }
    }

    return this.abyssBattleModel
      .find(queryFilter)
      .populate({
        path: 'party',
        select: 'oid rarity -_id',
      })
      .exec();
  }

  async aggregate(filter: ListAbyssBattleInput) {
    const battleIndices = 2;
    const abyssData: AbyssStats[] = [];
    const battles = await this.list(filter);

    _.forEach(battles, ({ floor_level, battle_index, party }) => {
      if (filter) {
        if (filter.charIds) {
          if (
            _.difference(
              filter.charIds,
              party.map((member: any) => member.oid),
            ).length !== 0
          ) {
            return;
          }
        }

        if (filter.f2p) {
          if (
            _.find(party, ({ oid, rarity }: any) => {
              if (filter.charIds) {
                return !_.includes(filter.charIds, oid) && rarity === 5;
              } else {
                return rarity === 5;
              }
            })
          )
            return;
        }
      }

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
        party_stats[i] = _.take(_.orderBy(battle, 'count', 'desc'), 10);
      });
    });

    return abyssData.sort(_compareFloor);
  }
}
