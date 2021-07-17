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

  async aggregateBattles() {
    const battleIndices = 2;
    const abyssBattles: AbyssStats[] = [];
    let abyssTeams = [];
    const battles = await this.abyssBattleModel
      .find()
      .lean()
      .populate([
        {
          path: 'party',
          model: PlayerCharacter.name,
          select: 'character -_id',
          populate: {
            path: 'character',
            select: '_id',
          },
        },
      ])
      .exec();
    // const battle_indexes = { 1: 0, 2: 0 };

    _.forEach(battles, ({ floor_level, battle_index, party }) => {
      // battle_indexes[battle_index]++;

      const battleParty = _.map(party, ({ character }: any) => character._id.toString());
      battleParty.sort();

      // Aggregate teams
      const teamIdx = _.findIndex(abyssTeams, { party: battleParty });
      if (teamIdx > -1) {
        abyssTeams[teamIdx].count++;
      } else {
        abyssTeams.push({
          party: battleParty,
          count: 1,
        });
      }

      // Aggregate abyss battles
      const floorIdx = _.findIndex(abyssBattles, { floor_level });

      if (floorIdx > -1) {
        const partyData = abyssBattles[floorIdx]['battle_parties'];

        const partyIdx = _.findIndex(partyData[battle_index - 1], (battle: any) =>
          _.isEqual(battle.party, battleParty),
        );

        if (partyIdx > -1) {
          partyData[battle_index - 1][partyIdx].count++;
          abyssBattles[floorIdx].totals[battle_index - 1]++;
        } else {
          if (partyData.length) {
            partyData[battle_index - 1].push({
              party: battleParty,
              count: 1,
            });
          } else {
            partyData[battle_index - 1] = [
              {
                party: battleParty,
                count: 1,
              },
            ];
          }
        }
      } else {
        const battle_parties = new Array(battleIndices).fill([]);
        const totals = new Array(battleIndices).fill(0);

        battle_parties[battle_index - 1][0] = { party, count: 1 };
        totals[battle_index - 1] = 1;

        abyssBattles.push({
          battle_parties,
          totals,
          floor_level,
        });
      }
    });

    const threshold = 2;

    abyssTeams = _.take(_.orderBy(abyssTeams, 'count', 'desc'), 20);

    _.forEach(abyssBattles, ({ battle_parties }) => {
      _.forEach(battle_parties, (battle, i) => {
        battle_parties[i] = _.orderBy(
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
    fs.writeFileSync('src/data/abyssData.json', JSON.stringify(abyssData));
  }
}
