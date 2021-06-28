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
  ) {}

  async list(filter: ListAbyssBattleInput = {}) {
    const queryFilter = {};

    if (filter) {
      const { floorLevels } = filter;
      if (floorLevels && floorLevels.length > 0) {
        queryFilter['floor_level'] = { $in: floorLevels };
      }
    }

    const abyssBattles = await this.abyssBattleModel
      .find(queryFilter)
      .lean()
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
          select: 'total_star -_id',
        },
      ])
      .exec();

    const filteredBattles = [];
    _.forEach(abyssBattles, (battle) => {
      const _battle = battle as unknown as any;

      const battleStats = {
        party: _.map(_battle.party, ({ character }) => character._id.toString()),
        floor_level: _battle.floor_level,
        battle_index: _battle.battle_index,
      };

      if (battleStats.party.length < 4) return;

      if (filter.charIds) {
        if (_.difference(filter.charIds, battleStats.party).length !== 0) {
          return;
        }
      }

      if (filter.f2p) {
        if (filter.charIds) {
          if (
            _.find(
              _battle.party,
              ({ character }) => character.rarity > 4 && !_.includes(filter.charIds, character._id),
            )
          ) {
            return;
          }
        } else {
          if (_.find(_battle.party, ({ character }) => character.rarity > 4)) {
            return;
          }
        }
      }

      if (filter.totalStars) {
        if (_battle.player.total_star < filter.totalStars) {
          return;
        }
      }

      filteredBattles.push(battleStats);
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
        party.sort();

        const partyIdx = _.findIndex(
          partyData[battle_index - 1],
          (battle: { party: string[]; count: number }) => _.isEqual(battle.party, party),
        );

        if (partyIdx > -1) {
          partyData[battle_index - 1][partyIdx].count++;
        } else {
          if (partyData.length) {
            partyData[battle_index - 1].push({
              party,
              count: 1,
            });
          } else {
            partyData[battle_index - 1] = [
              {
                party,
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

    return abyssData;
  }
}
