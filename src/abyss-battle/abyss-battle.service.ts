import _ from 'lodash';
import { Model, Types } from 'mongoose';
import { CharacterDocument } from 'src/character/character.model';
import { PlayerDocument } from 'src/player/player.model';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// import { Character, CharacterDocument } from '../character/character.model';
import { PlayerCharacter, PlayerCharacterDocument } from '../player-character/player-character.model';
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

    @InjectModel(AbyssBattle.name)
    private characterModel: Model<CharacterDocument>,

    @InjectModel(AbyssBattle.name)
    private playerModel: Model<PlayerDocument>,
  ) {}

  async list(filter: ListAbyssBattleInput) {
    const queryFilter = {};

    if (filter) {
      const { floorLevels } = filter;
      if (floorLevels && floorLevels.length > 0) {
        queryFilter['floor_level'] = { $in: floorLevels };
      }
    }

    const abyssBattles = await this.abyssBattleModel
      .find(queryFilter)
      .populate([
        {
          path: 'party',
          model: PlayerCharacter.name,
          select: 'character -_id',
          populate: {
            path: 'character',
            select: 'rarity _id',
          },
        },
        {
          path: 'player',
          select: 'total_star',
        },
      ])
      .exec();

    const filteredBattles = _.filter(abyssBattles, (battle) => {
      if (filter.charIds) {
        if (
          _.difference(
            filter.charIds,
            _.map(battle.party, ({ character }: any) => character._id.toString()),
          ).length !== 0
        ) {
          return false;
        } else {
          console.log(_.map(battle.party, ({ character }: any) => character._id.toString()));
        }
      }

      if (filter.f2p) {
        if (filter.charIds) {
          if (
            _.find(
              battle.party,
              (charObj: any) => charObj.rarity > 4 && _.includes(filter.charIds, charObj._id),
            )
          ) {
            return false;
          }
        } else {
          if (_.find(battle.party, (charObj: any) => charObj.rarity > 4)) {
            return false;
          }
        }
      }

      if (filter.totalStars) {
        const playerObj = battle.player as unknown as any;
        if (playerObj.total_star < filter.totalStars) {
          return false;
        }
      }

      return true;
    });

    return filteredBattles;
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
        party_stats[i] = _.take(_.orderBy(battle, 'count', 'desc'), 10);
      });
    });

    return abyssData.sort(_compareFloor);
  }
}
