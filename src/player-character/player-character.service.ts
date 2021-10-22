import { count } from 'console';
import {
  countBy,
  filter,
  find,
  findIndex,
  forEach,
  forIn,
  includes,
  isEqual,
  keys,
  map,
  omit,
  sortBy,
} from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { AbyssBattle, AbyssBattleDocument } from '../abyss-battle/abyss-battle.model';
import { Affix, ArtifactSet, ArtifactSetDocument } from '../artifact-set/artifact-set.model';
// import abyssBattles from '../data/abyssBattles.json';
import weaponModel, { WeaponDocument } from '../weapon/weapon.model';
import { ListPlayerCharacterInput } from './player-character.inputs';
import { CharacterBuildStats, PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

const BP_WEAPONS = [
  'The Black Sword',
  'Serpent Spine',
  'Solar Pearl',
  'The Viridescent Hunt',
  'Deathmatch',
];

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

function addCharacterBuild(
  data: any,
  character: any,
  constellation: any,
  artifactSetCombinations: any,
  charWeapon: any,
  parties: any,
  buildsAbyssUsageCounts: any,
) {
  const charIdx = findIndex(data, { char_id: character._id });

  if (charIdx > -1) {
    data[charIdx].constellations[constellation]++;

    const buildIdx = findIndex(data[charIdx].builds, (build: any) =>
      isEqual(build.artifacts, artifactSetCombinations),
    );

    const buildCounts = find(buildsAbyssUsageCounts, (build) =>
      isEqual(build.artifactSetCombinations, artifactSetCombinations),
    );

    if (buildIdx > -1) {
      // Update weapons
      const weaponIdx = findIndex(data[charIdx].builds[buildIdx].weapons, {
        _id: charWeapon._id,
      });

      if (weaponIdx < 0) {
        data[charIdx].builds[buildIdx].weapons.push({ _id: charWeapon._id, count: 1 });
      } else {
        data[charIdx].builds[buildIdx].weapons[weaponIdx].count++;
      }

      // Update artifact set count
      data[charIdx].builds[buildIdx].count++;
    } else {
      data[charIdx].builds.push({
        weapons: [
          {
            _id: charWeapon._id,
            count: 1,
          },
        ],
        artifacts: artifactSetCombinations,
        count: 1,
      });

      if (buildCounts) {
        const buildWeaponIdx = findIndex(
          buildCounts.weapons,
          (weapon: any) => weapon._id === charWeapon._id,
        );

        if (buildWeaponIdx > -1) {
          const currIdx = data[charIdx].builds[buildIdx].weapons.length - 1;
          data[charIdx].builds[buildIdx].weapons[currIdx].abyssCount =
            buildCounts[buildWeaponIdx].count[0];
          data[charIdx].builds[buildIdx].weapons[currIdx].abyssWins = buildCounts[buildWeaponIdx].count[1];
        }
      }
    }

    // data[charIdx].avg_level = Math.floor(
    //   data[charIdx].avg_level +
    //     (level - data[charIdx].avg_level) / data[charIdx].total,
    // );
  } else {
    const constellations = new Array(7).fill(0);
    constellations[constellation] = 1;

    data.push({
      char_id: character._id,
      constellations,
      // avg_level: level,
      builds: [
        {
          weapons: [{ _id: charWeapon._id, count: 1 }],
          artifacts: artifactSetCombinations,
          count: 1,
        },
      ],
      teams: parties,
    });
  }
}

const options = { maxTimeMS: 21600000, allowDiskUse: true, noCursorTimeout: true };

@Injectable()
export class PlayerCharacterService {
  constructor(
    @InjectModel(PlayerCharacter.name)
    private playerCharacterModel: Model<PlayerCharacterDocument>,
  ) {}

  async list(filter: ListPlayerCharacterInput = {}) {
    const playerCharacters = await this.playerCharacterModel
      .find()
      .lean()
      .populate([
        {
          path: 'character',
          select: 'rarity _id',
        },
        {
          path: 'player',
          select: 'total_star',
        },
        {
          path: 'weapon',
          select: 'rarity name _id',
        },
        {
          path: 'artifacts',
          select: 'set',
          populate: {
            path: 'set',
            select: 'affixes _id',
          },
        },
      ])
      .exec();

    const filteredCharacters = [];
    forEach(playerCharacters, (character) => {
      const _character = character as unknown as any;

      if (filter.charIds) {
        if (!filter.charIds.includes(_character.character._id.toString())) {
          return;
        }
      }

      if (filter.uids) {
        if (!filter.uids.includes(_character.player.uid)) {
          return;
        }
      }

      if (filter.f2p) {
        if (_character.weapon.rarity > 4 || BP_WEAPONS.includes(_character.weapon.name)) {
          return;
        }
      }

      if (filter.totalStars) {
        if (_character.player.total_star < filter.totalStars) {
          return;
        }
      }

      filteredCharacters.push(character);
    });

    return filteredCharacters;
  }

  async getTopBuilds(match = {}, limit = 100) {
    return await this.playerCharacterModel
      .aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              weapon: '$weapon',
              artifactSets: '$artifactSets',
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: '$_id.artifactSets',
            weapons: {
              $push: {
                _id: '$_id.weapon',
                count: '$count',
              },
            },
            count: {
              $sum: '$count',
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

  async aggregateAll(teams: any, abyssUsageCounts: any) {
    const playerCharacters = await this.playerCharacterModel
      .find()
      .lean()
      .populate([
        {
          path: 'character',
          select: 'rarity _id',
        },
        {
          path: 'player',
          select: 'total_star',
        },
        {
          path: 'weapon',
          select: 'rarity type_name name _id',
        },
        {
          path: 'artifacts',
          select: 'set',
          populate: {
            path: 'set',
            select: 'affixes _id',
          },
        },
      ])
      .exec();

    const characterBuilds: CharacterBuildStats[] = [];
    const mainCharacterBuilds: CharacterBuildStats[] = [];
    const topWeaponStats = [];
    const topArtifactSetStats = [];
    const topCharacterStats = [];

    forEach(playerCharacters, ({ _id, character, weapon, artifacts, constellation, level }: any) => {
      const charWeapon = <WeaponDocument>weapon;
      const playerSets: any = {};
      const parties = filter(teams, ({ party }) => includes(party, character._id.toString()));

      // ===== PLAYER BUILDS =====

      // Get artifact set combinations
      forEach(artifacts, (relic: any) => {
        if (playerSets.hasOwnProperty(relic['set']._id)) {
          playerSets[relic['set']._id.toString()].count++;
        } else {
          playerSets[relic['set']._id.toString()] = {
            count: 1,
            affixes: map(relic['set'].affixes, (affix) => omit(affix, ['_id'])),
          };
        }
      });

      if (keys(playerSets).length > 2) return;

      let artifactSetCombinations: { _id: string; activation_number: number }[] = [];

      forIn(playerSets, (set, _id) => {
        const activationNum = _getActivationNumber(set.count, set.affixes);

        if (activationNum > 1) {
          artifactSetCombinations.push({
            _id,
            activation_number: activationNum,
          });
        }
      });

      artifactSetCombinations = sortBy(artifactSetCombinations, (set) => set._id.toString());
      addCharacterBuild(
        characterBuilds,
        character,
        constellation,
        artifactSetCombinations,
        charWeapon,
        parties,
        abyssUsageCounts.builds,
      );

      if (level >= 90) {
        addCharacterBuild(
          mainCharacterBuilds,
          character,
          constellation,
          artifactSetCombinations,
          charWeapon,
          parties,
          abyssUsageCounts.builds,
        );
      }

      // ===== CHARACTER STATS ====
      const charStatIdx = findIndex(topCharacterStats, { _id: character._id });
      if (charStatIdx > -1) {
        topCharacterStats[charStatIdx].total++;
      } else {
        const abyssCount = abyssUsageCounts.characters[character._id]
          ? abyssUsageCounts.characters[character._id][0]
          : 0;

        topCharacterStats.push({
          _id: character._id,
          total: 1,
          abyssCount,
          abyssWins: abyssUsageCounts.characters[character._id]
            ? abyssUsageCounts.characters[character._id][1]
            : 0,
        });
      }

      // ===== WEAPON STATS =====
      const weaponStatIdx = findIndex(topWeaponStats, { _id: charWeapon._id });
      if (weaponStatIdx > -1) {
        const charIdx = findIndex(topWeaponStats[weaponStatIdx].characters, {
          _id: character._id.toString(),
        });

        if (charIdx > -1) {
          topWeaponStats[weaponStatIdx].characters[charIdx].count++;
        } else {
          topWeaponStats[weaponStatIdx].characters.push({
            _id: character._id.toString(),
            count: 1,
          });
        }

        topWeaponStats[weaponStatIdx].count++;
      } else {
        const abyssCount = abyssUsageCounts.weapons[charWeapon._id]
          ? abyssUsageCounts.weapons[charWeapon._id][0]
          : 0;

        topWeaponStats.push({
          _id: charWeapon._id,
          characters: [
            {
              _id: character._id.toString(),
              count: 1,
            },
          ],
          type_name: charWeapon.type_name,
          rarity: charWeapon.rarity,
          count: 1,
          abyssCount,
          abyssWins: abyssUsageCounts.weapons[charWeapon._id]
            ? abyssUsageCounts.weapons[charWeapon._id][1]
            : 0,
        });
      }

      // ===== ARTIFACT SET STATS =====
      const artifactStatIdx = findIndex(topArtifactSetStats, ({ artifacts }) =>
        isEqual(artifacts, artifactSetCombinations),
      );
      if (artifactStatIdx > -1) {
        const charIdx = findIndex(topArtifactSetStats[artifactStatIdx].characters, {
          _id: character._id.toString(),
        });

        if (charIdx > -1) {
          topArtifactSetStats[artifactStatIdx].characters[charIdx].count++;
        } else {
          topArtifactSetStats[artifactStatIdx].characters.push({
            _id: character._id.toString(),
            count: 1,
          });
        }

        topArtifactSetStats[artifactStatIdx].count++;
      } else {
        const abyssSetIdx = findIndex(abyssUsageCounts.artifactSets, ({ artifacts }) =>
          isEqual(artifacts, artifactSetCombinations),
        );

        const abyssCount = abyssSetIdx > -1 ? abyssUsageCounts.artifactSets[abyssSetIdx].count[0] : 0;
        const abyssWins = abyssSetIdx > -1 ? abyssUsageCounts.artifactSets[abyssSetIdx].count[1] : 0;
        topArtifactSetStats.push({
          artifacts: artifactSetCombinations,
          characters: [
            {
              _id: character._id.toString(),
              count: 1,
            },
          ],
          count: 1,
          abyssCount,
          abyssWins,
        });
      }
    });

    return {
      topWeaponStats,
      topArtifactSetStats,
      characterBuilds,
      mainCharacterBuilds,
      topCharacterStats,
    };
  }

  async aggregateBuilds(filter: ListPlayerCharacterInput = {}) {
    // const playerCharacters = await this.list(filter);
    // const characterData: CharacterBuildStats[] = [];
    // forEach(playerCharacters, ({ character, weapon, artifacts, constellation, level }: any) => {
    //   const charWeapon = <WeaponDocument>weapon;
    //   const playerSets: any = {};
    //   // Get artifact set combinations
    //   forEach(artifacts, (relic: any) => {
    //     if (playerSets.hasOwnProperty(relic['set']._id.toString())) {
    //       playerSets[relic['set']._id.toString()].count++;
    //     } else {
    //       playerSets[relic['set'].toString()] = {
    //         count: 1,
    //         affixes: map(relic['set'].affixes, (affix) => omit(affix, ['_id'])),
    //       };
    //     }
    //   });
    //   if (keys(playerSets).length > 2) return;
    //   let artifactSetCombinations: { _id: string; activation_number: number }[] = [];
    //   forIn(playerSets, (set, _id) => {
    //     const activationNum = _getActivationNumber(set.count, set.affixes);
    //     if (activationNum > 1) {
    //       artifactSetCombinations.push({
    //         _id,
    //         activation_number: activationNum,
    //       });
    //     }
    //   });
    //   artifactSetCombinations = sortBy(artifactSetCombinations, (set) => set._id.toString());
    //   const charIdx = findIndex(characterData, { char_id: character._id.toString() });
    //   if (charIdx > -1) {
    //     characterData[charIdx].constellations[constellation]++;
    //     const buildIdx = findIndex(characterData[charIdx].builds, (build) =>
    //       isEqual(build.artifacts, artifactSetCombinations),
    //     );
    //     if (buildIdx < 0) {
    //       characterData[charIdx].builds.push({
    //         weapons: [{ _id: charWeapon._id.toString(), count: 1 }],
    //         artifacts: artifactSetCombinations,
    //         count: 1,
    //       });
    //     } else {
    //       // Update weapons
    //       const weaponIdx = findIndex(characterData[charIdx].builds[buildIdx].weapons, {
    //         _id: charWeapon._id.toString(),
    //       });
    //       if (weaponIdx < 0) {
    //         characterData[charIdx].builds[buildIdx].weapons.push({
    //           _id: charWeapon._id.toString(),
    //           count: 1,
    //         });
    //       } else {
    //         characterData[charIdx].builds[buildIdx].weapons[weaponIdx].count++;
    //       }
    //       // Update artifact set count
    //       characterData[charIdx].builds[buildIdx].count++;
    //     }
    //     // characterData[charIdx].avg_level = Math.floor(
    //     //   characterData[charIdx].avg_level +
    //     //     (level - characterData[charIdx].avg_level) / characterData[charIdx].total,
    //     // );
    //   } else {
    //     const constellations = new Array(7).fill(0);
    //     constellations[constellation] = 1;
    //     // characterData.push({
    //     //   char_id: character._id,
    //     //   constellations,
    //     //   // avg_level: level,
    //     //   builds: [
    //     //     {
    //     //       weapons: [{ _id: charWeapon._id, count: 1 }],
    //     //       artifacts: artifactSetCombinations,
    //     //       count: 1,
    //     //     },
    //     //   ],
    //     //   total: 1,
    //     // });
    //   }
    // });
    // return characterData;
  }

  aggregate(teams: any, abyssUsageCounts: any) {
    // await this.aggregateAll();
    return this.aggregateAll(teams, abyssUsageCounts);
  }

  getStats() {
    return this.playerCharacterModel.find().lean().countDocuments();
  }
}
