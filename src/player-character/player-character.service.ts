import _ from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { AbyssBattle, AbyssBattleDocument } from '../abyss-battle/abyss-battle.model';
import { Affix } from '../artifact-set/artifact-set.model';
// import abyssBattles from '../data/abyssBattles.json';
import { WeaponDocument } from '../weapon/weapon.model';
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
  const activations = _.map(affixes, (effect) => effect.activation_number);

  let activation = 0;
  _.forEach(activations, (activation_num) => {
    if (count >= activation_num) {
      activation = activation_num;
    }
  });

  return activation;
}

@Injectable()
export class PlayerCharacterService {
  constructor(
    @InjectModel(PlayerCharacter.name)
    private playerCharacterModel: Model<PlayerCharacterDocument>,

    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,
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
    _.forEach(playerCharacters, (character) => {
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

  async aggregateAll() {
    // const abyssUsageCounts = {
    //   characters: {},
    //   weapons: {},
    //   artifactSets: [],
    // };

    // const abyssBattles = await this.abyssBattleModel
    //   .find()
    //   .lean()
    //   .populate([
    //     {
    //       path: 'party',
    //       model: PlayerCharacter.name,
    //       select: 'weapon artifacts character -_id',
    //       populate: [
    //         {
    //           path: 'character',
    //           select: '_id',
    //         },
    //         {
    //           path: 'artifacts',
    //           select: 'set -_id',
    //         },
    //       ],
    //     },
    //   ])
    //   .exec();

    // _.forEach(abyssBattles, ({ party }) => {
    //   _.forEach(party, ({ character, artifacts, weapon }: any) => {
    //     if (abyssUsageCounts.characters[character._id]) {
    //       abyssUsageCounts.characters[character._id]++;
    //     } else {
    //       abyssUsageCounts.characters[character._id] = 1;
    //     }

    //     if (abyssUsageCounts.weapons[weapon]) {
    //       abyssUsageCounts.weapons[weapon]++;
    //     } else {
    //       abyssUsageCounts.weapons[weapon] = 1;
    //     }

    //     const artifactSetCombinations = [];
    //     _.forEach(_.countBy(artifacts, 'set'), (count, _id) => {
    //       if (count > 1) {
    //         let activation_number = count;
    //         if (count % 2 !== 0) {
    //           activation_number = count - 1;
    //         }
    //         artifactSetCombinations.push({
    //           _id,
    //           activation_number,
    //         });
    //       }
    //     });

    //     const buildIdx = _.findIndex(abyssUsageCounts.artifactSets, (build: any) =>
    //       _.isEqual(build.artifacts, artifactSetCombinations),
    //     );

    //     if (buildIdx > 0) {
    //       abyssUsageCounts.artifactSets[buildIdx].count++;
    //     } else {
    //       abyssUsageCounts.artifactSets.push({
    //         artifacts: artifactSetCombinations,
    //         count: 1,
    //       });
    //     }
    //   });
    // });

    const teams = [];

    const abyssBattles = await this.abyssBattleModel
      .find()
      .lean()
      .populate([
        {
          path: 'party',
          model: PlayerCharacter.name,
          select: 'character -_id',
          populate: [
            {
              path: 'character',
              select: '_id',
            },
          ],
        },
      ])
      .exec();

    _.forEach(abyssBattles, ({ party }) => {
      const charIds = _.map(party, ({ character }: any) => character._id.toString()).sort();
      const teamIndex = _.findIndex(teams, { party: charIds });

      if (teamIndex > -1) {
        teams[teamIndex].count++;
      } else {
        teams.push({
          party: charIds,
          count: 1,
        });
      }
    });

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
    const weaponStats = [];
    const artifactSetStats = [];
    const characterStats = [];

    _.forEach(playerCharacters, ({ _id, character, weapon, artifacts, constellation, level }: any) => {
      const charWeapon = <WeaponDocument>weapon;
      const playerSets: any = {};
      let parties = _.filter(teams, ({ party }) => _.includes(party, character._id.toString()));

      // ===== PLAYER BUILDS =====

      // Get artifact set combinations
      _.forEach(artifacts, (relic: any) => {
        if (playerSets.hasOwnProperty(relic['set']._id)) {
          playerSets[relic['set']._id].count++;
        } else {
          playerSets[relic['set']._id] = {
            count: 1,
            affixes: relic['set'].affixes,
          };
        }
      });

      if (_.keys(playerSets).length > 2) return;

      let artifactSetCombinations: { _id: string; activation_number: number }[] = [];

      _.forIn(playerSets, (set, _id) => {
        const activationNum = _getActivationNumber(set.count, set.affixes);

        if (activationNum > 1) {
          artifactSetCombinations.push({
            _id,
            activation_number: activationNum,
          });
        }
      });

      artifactSetCombinations = _.sortBy(artifactSetCombinations, (set) => set._id);

      const charIdx = _.findIndex(characterBuilds, { char_id: character._id });

      if (charIdx > -1) {
        characterBuilds[charIdx].constellations[constellation]++;

        const buildIdx = _.findIndex(characterBuilds[charIdx].builds, (build) =>
          _.isEqual(build.artifacts, artifactSetCombinations),
        );
        if (buildIdx > -1) {
          // Update weapons
          const weaponIdx = _.findIndex(characterBuilds[charIdx].builds[buildIdx].weapons, {
            _id: charWeapon._id,
          });
          if (weaponIdx < 0) {
            characterBuilds[charIdx].builds[buildIdx].weapons.push({ _id: charWeapon._id, count: 1 });
          } else {
            characterBuilds[charIdx].builds[buildIdx].weapons[weaponIdx].count++;
          }

          // Update artifact set count
          characterBuilds[charIdx].builds[buildIdx].count++;
        } else {
          characterBuilds[charIdx].builds.push({
            weapons: [{ _id: charWeapon._id, count: 1 }],
            artifacts: artifactSetCombinations,
            count: 1,
          });
        }

        characterBuilds[charIdx].total++;
        // characterBuilds[charIdx].avg_level = Math.floor(
        //   characterBuilds[charIdx].avg_level +
        //     (level - characterBuilds[charIdx].avg_level) / characterBuilds[charIdx].total,
        // );
      } else {
        const constellations = new Array(7).fill(0);
        constellations[constellation] = 1;

        const threshold = 2;
        parties = _.filter(parties, ({ count }) => count > threshold);

        characterBuilds.push({
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
          teams: _.orderBy(parties, 'count', 'desc'),
          total: 1,
        });
      }

      // ===== CHARACTER STATS ====
      const charStatIdx = _.findIndex(characterStats, { _id: character._id });
      if (charStatIdx > -1) {
        characterStats[charStatIdx].total++;
      } else {
        characterStats.push({
          _id: character._id,
          total: 1,
          // abyssCount: abyssUsageCounts.characters[character._id],
        });
      }

      // ===== WEAPON STATS =====
      const weaponStatIdx = _.findIndex(weaponStats, { _id: charWeapon._id });
      if (weaponStatIdx > -1) {
        if (weaponStats[weaponStatIdx].characters[character._id]) {
          weaponStats[weaponStatIdx].characters[character._id]++;
        } else {
          weaponStats[weaponStatIdx].characters[character._id] = 1;
        }

        weaponStats[weaponStatIdx].count++;
      } else {
        weaponStats.push({
          _id: charWeapon._id,
          characters: {
            [character._id]: 1,
          },
          type_name: charWeapon.type_name,
          rarity: charWeapon.rarity,
          count: 1,
          // abyssCount: abyssUsageCounts.weapons[charWeapon._id],
        });
      }

      // ===== ARTIFACT SET STATS =====
      const artifactStatIdx = _.findIndex(artifactSetStats, ({ artifacts }) =>
        _.isEqual(artifacts, artifactSetCombinations),
      );
      if (artifactStatIdx > -1) {
        if (artifactSetStats[artifactStatIdx].characters[character._id]) {
          artifactSetStats[artifactStatIdx].characters[character._id]++;
        } else {
          artifactSetStats[artifactStatIdx].characters[character._id] = 1;
        }

        artifactSetStats[artifactStatIdx].count++;
      } else {
        // const abyssSetIdx = _.findIndex(abyssUsageCounts.artifactSets, ({ artifacts }) =>
        //   _.isEqual(artifacts, artifactSetCombinations),
        // );

        // const abyssCount = abyssSetIdx > -1 ? abyssUsageCounts.artifactSets[abyssSetIdx].count : 0;
        artifactSetStats.push({
          artifacts: artifactSetCombinations,
          characters: {
            [character._id]: 1,
          },
          count: 1,
          // abyssCount,
        });
      }
    });

    const threshold = 3;

    _.forEach(characterBuilds, ({ total, builds }, i) => {
      characterBuilds[i].builds = _.orderBy(
        _.filter(builds, ({ count }) => count >= threshold),
        'count',
        'desc',
      );
    });

    return { weaponStats, artifactSetStats, characterStats, characterBuilds };
  }

  async aggregateBuilds(filter: ListPlayerCharacterInput = {}) {
    const playerCharacters = await this.list(filter);
    const characterData: CharacterBuildStats[] = [];

    _.forEach(playerCharacters, ({ character, weapon, artifacts, constellation, level }: any) => {
      const charWeapon = <WeaponDocument>weapon;
      const playerSets: any = {};

      // Get artifact set combinations
      _.forEach(artifacts, (relic: any) => {
        if (playerSets.hasOwnProperty(relic['set']._id)) {
          playerSets[relic['set']._id].count++;
        } else {
          playerSets[relic['set']._id] = {
            count: 1,
            affixes: relic['set'].affixes,
          };
        }
      });

      if (_.keys(playerSets).length > 2) return;

      let artifactSetCombinations: { _id: string; activation_number: number }[] = [];

      _.forIn(playerSets, (set, _id) => {
        const activationNum = _getActivationNumber(set.count, set.affixes);

        if (activationNum > 1) {
          artifactSetCombinations.push({
            _id,
            activation_number: activationNum,
          });
        }
      });

      artifactSetCombinations = _.sortBy(artifactSetCombinations, (set) => set._id);

      const charIdx = _.findIndex(characterData, { char_id: character._id });

      if (charIdx > -1) {
        characterData[charIdx].constellations[constellation]++;

        const buildIdx = _.findIndex(characterData[charIdx].builds, (build) =>
          _.isEqual(build.artifacts, artifactSetCombinations),
        );
        if (buildIdx < 0) {
          characterData[charIdx].builds.push({
            weapons: [{ _id: charWeapon._id, count: 1 }],
            artifacts: artifactSetCombinations,
            count: 1,
          });
        } else {
          // Update weapons
          const weaponIdx = _.findIndex(characterData[charIdx].builds[buildIdx].weapons, {
            _id: charWeapon._id,
          });
          if (weaponIdx < 0) {
            characterData[charIdx].builds[buildIdx].weapons.push({ _id: charWeapon._id, count: 1 });
          } else {
            characterData[charIdx].builds[buildIdx].weapons[weaponIdx].count++;
          }

          // Update artifact set count
          characterData[charIdx].builds[buildIdx].count++;
        }

        characterData[charIdx].total++;
        // characterData[charIdx].avg_level = Math.floor(
        //   characterData[charIdx].avg_level +
        //     (level - characterData[charIdx].avg_level) / characterData[charIdx].total,
        // );
      } else {
        const constellations = new Array(7).fill(0);
        constellations[constellation] = 1;

        // characterData.push({
        //   char_id: character._id,
        //   constellations,
        //   // avg_level: level,
        //   builds: [
        //     {
        //       weapons: [{ _id: charWeapon._id, count: 1 }],
        //       artifacts: artifactSetCombinations,
        //       count: 1,
        //     },
        //   ],
        //   total: 1,
        // });
      }
    });

    const threshold = 3;

    _.forEach(characterData, ({ total, builds }, i) => {
      characterData[i].builds = _.orderBy(
        _.filter(builds, ({ count }) => count >= threshold),
        'count',
        'desc',
      );
    });

    return characterData;
  }

  aggregate() {
    // await this.aggregateAll();
    return this.aggregateAll();
  }
}
