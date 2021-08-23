import { difference, find, findIndex, forEach, includes, isEqual, map } from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// import { Character, CharacterDocument } from '../character/character.model';
import { PlayerCharacter } from '../player-character/player-character.model';
import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument, AbyssStats } from './abyss-battle.model';

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,
  ) {}

  async list(filter: ListAbyssBattleInput = {}) {
    const queryFilter = {};

    if (filter) {
      const { floorLevels, players, battle_index } = filter;
      if (floorLevels && floorLevels.length > 0) {
        queryFilter['floor_level'] = { $in: floorLevels };
      }

      if (players && players.length > 0) {
        queryFilter['player'] = { $in: players };
      }

      if (battle_index) {
        queryFilter['battle_index'] = battle_index;
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
    forEach(abyssBattles, (battle) => {
      const _battle = battle as unknown as any;

      const battleStats = {
        party: map(_battle.party, ({ character }) => character._id.toString()),
        floor_level: _battle.floor_level,
        battle_index: _battle.battle_index,
      };

      if (battleStats.party.length < 4) return;

      if (filter.charIds) {
        if (difference(filter.charIds, battleStats.party).length !== 0) {
          return;
        }
      }

      if (filter.f2p) {
        if (filter.charIds) {
          if (
            find(
              _battle.party,
              ({ character }) =>
                character.rarity > 4 && !includes(filter.charIds, character._id.toString()),
            )
          ) {
            return;
          }
        } else {
          if (find(_battle.party, ({ character }) => character.rarity > 4)) {
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
    const abyssBattles: { [floor: string]: AbyssStats } = {};
    const abyssTeams = [];
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

    forEach(battles, ({ floor_level, battle_index, party }) => {
      // battle_indexes[battle_index]++;
      if (party.length < 4) return;

      const battleParty = map(party, ({ character }: any) => character._id.toString()).sort();

      // Aggregate teams
      const teamIdx = findIndex(abyssTeams, (team) => isEqual(team.party, battleParty));
      if (teamIdx > -1) {
        abyssTeams[teamIdx].count++;
      } else {
        abyssTeams.push({
          party: battleParty,
          count: 1,
        });
      }

      // Aggregate abyss battles
      if (abyssBattles[floor_level]) {
        const partyData = abyssBattles[floor_level]['battle_parties'];

        const partyIdx = findIndex(partyData[battle_index - 1], (battle: any) =>
          isEqual(battle.party, battleParty),
        );

        if (partyIdx > -1) {
          partyData[battle_index - 1][partyIdx].count++;
        } else {
          if (partyData[battle_index - 1]) {
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
        const battle_parties = [[], []];
        battle_parties[battle_index - 1] = [{ party: battleParty, count: 1 }];

        abyssBattles[floor_level] = {
          battle_parties,
          floor_level,
        };
      }
    });

    return { teams: abyssTeams, abyss: abyssBattles };
  }

  aggregate() {
    return this.aggregateBattles();
  }

  getStats() {
    return this.abyssBattleModel.find().lean().countDocuments();
  }
}
