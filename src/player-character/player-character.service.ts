import _ from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Affix, ArtifactSet } from '../artifact-set/artifact-set.model';
import { WeaponDocument } from '../weapon/weapon.model';
import { ListPlayerCharacterInput } from './player-character.inputs';
import { CharacterStats, PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

const BP_WEAPONS = ["The Black Sword", "Serpent Spine", "Solar Pearl", "The Viridescent Hunt", "Deathmatch"]

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

function _getCharacterData(playerCharacters) {
  const characterData: CharacterStats[] = [];
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

    artifactSetCombinations = _.sortBy(artifactSetCombinations, set => set._id);

    const charIdx = _.findIndex(characterData, { char_id: character._id });

    if (charIdx > -1) {
      characterData[charIdx].constellations[constellation]++;

      const buildIdx = _.findIndex(characterData[charIdx].builds, build => _.isEqual(build.artifacts, artifactSetCombinations));
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
      characterData[charIdx].avg_level = Math.floor(
        characterData[charIdx].avg_level + (level - characterData[charIdx].avg_level) / characterData[charIdx].total,
      );
    } else {
      const constellations = new Array(7).fill(0);
      constellations[constellation] = 1;

      characterData.push({
        char_id: character._id,
        constellations,
        avg_level: level,
        builds: [
          {
            weapons: [{ _id: charWeapon._id, count: 1 }],
            artifacts: artifactSetCombinations,
            count: 1,
          },
        ],
        total: 1,
      });
    }
  });

  _.forEach(characterData, ({ builds }, i) => {
    characterData[i].builds = _.take(_.orderBy(builds, 'count', 'desc'), 10);
  });

  return characterData;
}

@Injectable()
export class PlayerCharacterService {
  constructor(
    @InjectModel(PlayerCharacter.name)
    private playerCharacterModel: Model<PlayerCharacterDocument>,
  ) {}

  async list(filter: ListPlayerCharacterInput) {
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
            select: 'affixes _id'
          }
        }
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
          return
        }
      }

      if (filter.f2p) {
        if (_character.weapon.rarity > 4 || BP_WEAPONS.includes(_character.weapon.name)) {
          return
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

  async aggregate(filter: ListPlayerCharacterInput) {
    const playerCharacters = await this.list(filter);

    return _getCharacterData(playerCharacters)
  }
}
