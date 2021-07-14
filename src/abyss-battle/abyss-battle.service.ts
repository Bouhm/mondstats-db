import fs from 'fs';
import _ from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// import { Character, CharacterDocument } from '../character/character.model';
import { PlayerCharacter } from '../player-character/player-character.model';
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
              ({ character }) =>
                character.rarity > 4 && !_.includes(filter.charIds, character._id.toString()),
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

  async aggregateBattles(filter: ListAbyssBattleInput = {}) {
    const battleIndices = 2;
    const abyssBattles: AbyssStats[] = [];
    let abyssTeams = [];
    const battles = await this.list(filter);

    _.forEach(battles, ({ floor_level, battle_index, party }) => {
      // Aggregate teams
      const teamIdx = _.findIndex(abyssTeams, { party });
      if (teamIdx > -1) {
        abyssTeams[teamIdx].count++;
      } else {
        abyssTeams.push({
          party,
          count: 1,
        });
      }

      // Aggregate abyss battles
      const floorIdx = _.findIndex(abyssBattles, { floor_level });
      const battleIdx = battle_index - 1;

      if (floorIdx > -1) {
        const partyData = abyssBattles[floorIdx]['parties'];
        party.sort();

        const partyIdx = _.findIndex(partyData[battleIdx], (battle: { party: string[]; count: number }) =>
          _.isEqual(battle.party, party),
        );

        if (partyIdx > -1) {
          partyData[battleIdx][partyIdx].count++;
          abyssBattles[floorIdx].totals[battleIdx]++;
        } else {
          if (partyData.length) {
            partyData[battleIdx].push({
              party,
              count: 1,
            });
          } else {
            partyData[battleIdx] = [
              {
                party,
                count: 1,
              },
            ];
          }
        }
      } else {
        const parties = new Array(battleIndices).fill([]);
        const totals = new Array(battleIndices).fill(0);

        parties[battle_index][0] = { party, count: 1 };
        totals[battle_index] = 1;

        abyssBattles.push({
          parties,
          totals,
          floor_level,
        });
      }
    });

    const threshold = 2;

    abyssTeams = _.take(_.orderBy(abyssTeams, 'count', 'desc'), 20);

    _.forEach(abyssBattles, ({ parties }) => {
      _.forEach(parties, (battle, i) => {
        parties[i] = _.orderBy(
          _.filter(battle, ({ count }) => count >= threshold),
          'count',
          'desc',
        );
      });
    });

    return { teams: abyssTeams, abyss: abyssBattles };
  }

  async save() {
    const abyssData = await this.aggregateBattles();
    fs.writeFileSync('src/data/abyssBattles.json', JSON.stringify(abyssData));
  }
}
