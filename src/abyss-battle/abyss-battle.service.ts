import {
  difference,
  find,
  findIndex,
  forEach,
  forIn,
  includes,
  isEqual,
  map,
  omit,
  sortBy,
  times,
} from 'lodash';
import { Model, ObjectId } from 'mongoose';
import { Character } from 'src/character/character.model';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Affix } from '../artifact-set/artifact-set.model';
// import { Character, CharacterDocument } from '../character/character.model';
import { PlayerCharacter } from '../player-character/player-character.model';
import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument, AbyssStats } from './abyss-battle.model';

function _getActivationNumber(count: number, affixes: Affix[]) {
  const activations = map(affixes, (effect) => effect.activation_number);

  let activation = 0;
  forEach(activations, (activation_num) => {
    if (count >= activation_num) {
      activation = activation_num;
    }
  });

  return activation;
}

const options = { maxTimeMS: 21600000, allowDiskUse: true, noCursorTimeout: true };

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

  async getTopParties(match: any = {}, limit = 100) {
    return this.abyssBattleModel
      .aggregate([
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            as: 'party',
          },
        },
        {
          $project: {
            _id: 0,
            party: {
              $map: {
                input: '$party',
                as: 'pc',
                in: {
                  $toString: '$$pc.character',
                },
              },
            },
          },
        },
        {
          $match: match,
        },
        {
          $group: {
            _id: '$party',
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .option(options)
      .exec();
  }

  async getTopFloorParties(floorLevel: string, match: any = {}, limit = 100) {
    return await Promise.all(
      times(2, (i) => {
        return this.abyssBattleModel
          .aggregate([
            {
              $lookup: {
                from: 'playercharacters',
                localField: 'party',
                foreignField: '_id',
                as: 'party',
              },
            },
            {
              $project: {
                _id: 0,
                party: {
                  $map: {
                    input: '$party',
                    as: 'pc',
                    in: '$$pc.character',
                  },
                },
              },
            },
            {
              $match: {
                ...match,
                floor_level: floorLevel,
                battle_index: i + 1,
              },
            },
            {
              $group: {
                _id: '$party',
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $sort: {
                count: -1,
              },
            },
            {
              $limit: limit,
            },
          ])
          .option(options)
          .exec();
      }),
    );
  }

  async aggregateBattles() {
    const battleIndices = 2;
    const abyssBattles: { [floor: string]: AbyssStats } = {};
    const abyssTeams = [];

    const abyssUsageCounts = {
      characters: {},
      weapons: {},
      artifactSets: [],
      builds: [],
    };

    const teams = [];

    const battles = await this.abyssBattleModel
      .find()
      .lean()
      .populate([
        {
          path: 'party',
          model: PlayerCharacter.name,
          select: 'character artifacts weapon -_id',
          populate: [
            {
              path: 'character',
              select: '_id',
            },
            {
              path: 'weapon',
              select: '_id',
            },
            {
              path: 'artifacts',
              select: 'set',
              populate: [
                {
                  path: 'set',
                  select: 'affixes _id',
                },
              ],
            },
          ],
        },
      ])
      .exec();

    forEach(battles, ({ party, floor_level, battle_index, star }) => {
      forEach(party, ({ character, weapon, artifacts }: any) => {
        // [abyssCount, abyssWins]
        if (abyssUsageCounts.characters[character._id]) {
          abyssUsageCounts.characters[character._id][0]++;
        } else {
          abyssUsageCounts.characters[character._id] = [1, 0];
        }

        if (abyssUsageCounts.weapons[weapon._id]) {
          abyssUsageCounts.weapons[weapon._id][0]++;
        } else {
          abyssUsageCounts.weapons[weapon._id] = [1, 0];
        }

        const playerSets: any = {};

        // Get artifact set combinations
        forEach(artifacts, async (relic: any) => {
          if (playerSets.hasOwnProperty(relic['set'].toString())) {
            playerSets[relic.set._id.toString()].count++;
          } else {
            playerSets[relic.set._id.toString()] = {
              count: 1,
              affixes: map(relic.set.affixes, (affix) => omit(affix, ['_id'])),
            };
          }
        });
        // console.log(playerSets)

        let artifactSetCombinations: { _id: string; activation_number: number }[] = [];
        forIn(playerSets, (set, _id) => {
          const activationNum = _getActivationNumber(set.count, set.affixes);
          // console.log(activationNum)

          if (activationNum > 1) {
            artifactSetCombinations.push({
              _id,
              activation_number: activationNum,
            });
          }
        });
        artifactSetCombinations = sortBy(artifactSetCombinations, (set) => set._id.toString());

        // console.log(artifactSetCombinations)
        const artifactSetIdx = findIndex(abyssUsageCounts.artifactSets, (set) => {
          // console.log(set.artifacts)
          return artifactSetCombinations.length && isEqual(set.artifacts, artifactSetCombinations);
        });

        if (artifactSetIdx > -1) {
          abyssUsageCounts.artifactSets[artifactSetIdx].count[0]++;

          if (star > 2) {
            abyssUsageCounts.artifactSets[artifactSetIdx].count[1]++;
          }
        } else {
          abyssUsageCounts.artifactSets.push({
            artifacts: artifactSetCombinations,
            count: [1, star > 2 ? 1 : 0],
          });
        }

        if (star > 2) {
          abyssUsageCounts.characters[character._id][1]++;
          abyssUsageCounts.weapons[weapon._id][1]++;
        }

        const setIdx = findIndex(abyssUsageCounts.artifactSets, (set: any) =>
          isEqual(set.artifacts, artifactSetCombinations),
        );

        if (setIdx > 0) {
          abyssUsageCounts.artifactSets[setIdx].count++;
        } else {
          abyssUsageCounts.artifactSets.push({
            artifacts: artifactSetCombinations,
            count: [1, star > 2 ? 1 : 0],
          });
        }

        const buildIdx = findIndex(abyssUsageCounts.builds, (build: any) =>
          isEqual(build.artifacts, artifactSetCombinations),
        );

        if (buildIdx > 0) {
          const buildWeaponIdx = findIndex(
            abyssUsageCounts.builds[buildIdx].weapons,
            (buildWeapon: any) => buildWeapon._id === weapon._id,
          );

          if (buildWeaponIdx > -1) {
            abyssUsageCounts.builds[buildIdx].weapons[buildWeaponIdx].count[0]++;

            if (star > 2) {
              abyssUsageCounts.builds[buildIdx].weapons[buildWeaponIdx].count[1]++;
            }
          } else {
            abyssUsageCounts.builds[buildIdx].weapons.push({
              _id: weapon._id,
              count: [1, star > 2 ? 1 : 0],
            });
          }
        } else {
          abyssUsageCounts.builds.push({
            artifacts: artifactSetCombinations,
            weapons: [
              {
                _id: weapon._id,
                count: [1, star > 2 ? 1 : 0],
              },
            ],
          });
        }
      });

      // if (party.length < 4) return;

      // TOP TEAMS
      const charIds = map(party, ({ character }: any) => character._id.toString()).sort();
      const teamIndex = findIndex(teams, (team) => isEqual(team.party, charIds));

      if (teamIndex > -1) {
        teams[teamIndex].count++;
      } else {
        teams.push({
          party: charIds,
          count: 1,
        });
      }

      // ABYSS DATA
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

    return { abyssUsage: abyssUsageCounts, charTeams: teams, teams: abyssTeams, abyss: abyssBattles };
  }

  aggregate() {
    return this.aggregateBattles();
  }

  getStats() {
    return this.abyssBattleModel.find().lean().countDocuments();
  }
}
