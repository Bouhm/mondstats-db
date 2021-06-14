import _ from 'lodash';
import { Model } from 'mongoose';
import { Affix, ArtifactSet } from 'src/artifact-set/artifact-set.model';
import { WeaponDocument } from 'src/weapon/weapon.model';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListPlayerCharacterInput } from './player-character.inputs';
import { CharacterStats, PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

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
  ) {}

  list(filter: ListPlayerCharacterInput) {
    const queryFilter = {};

    if (filter) {
      const { charIds, uids } = filter;
      if (charIds && charIds.length > 0) {
        queryFilter['charIds'] = { $in: charIds };
      }

      if (uids && uids.length > 0) {
        queryFilter['uid'] = { $in: uids };
      }
    }

    return this.playerCharacterModel
      .find(queryFilter)
      .populate('weapon', 'oid')
      .populate({
        path: 'artifacts',
        populate: {
          path: 'set',
          model: ArtifactSet.name,
          select: 'oid affixes',
        },
      })
      .exec();
  }

  async aggregate(filter: ListPlayerCharacterInput) {
    const characterData: CharacterStats[] = [];
    const playerCharacters = await this.list(filter);

    _.forEach(playerCharacters, ({ oid, weapon, artifacts, constellation, level }: any) => {
      const charWeapon = <WeaponDocument>weapon;
      const playerSets: any = {};

      // Get artifact set combinations
      _.forEach(artifacts, (relic: any) => {
        if (playerSets.hasOwnProperty(relic['set'].oid)) {
          playerSets[relic['set'].oid].count++;
        } else {
          playerSets[relic['set'].oid] = {
            count: 1,
            affixes: relic['set'].affixes,
          };
        }
      });

      if (_.keys(playerSets).length > 2) return;

      let buildIdNum = -1;
      const artifactSetCombinations: { oid: number; activation_number: number }[] = [];

      _.forIn(playerSets, (set, oid) => {
        const activationNum = _getActivationNumber(set.count, set.affixes);
        buildIdNum += parseInt(oid) * activationNum;

        if (activationNum > 1) {
          artifactSetCombinations.push({
            oid: parseInt(oid),
            activation_number: activationNum,
          });
        }
      });

      const charIdx = _.findIndex(characterData, { oid });

      if (charIdx > -1) {
        characterData[charIdx].constellations[constellation]++;

        const buildIdx = _.findIndex(characterData[charIdx].builds, { buildId: buildIdNum });
        if (buildIdx < 0) {
          characterData[charIdx].builds.push({
            buildId: buildIdNum,
            weapons: [{ oid: charWeapon.oid, count: 1 }],
            artifacts: artifactSetCombinations,
            count: 1,
          });
        } else {
          // Update weapons
          const weaponIdx = _.findIndex(characterData[charIdx].builds[buildIdx].weapons, {
            oid: charWeapon.oid,
          });
          if (weaponIdx < 0) {
            characterData[charIdx].builds[buildIdx].weapons.push({ oid: charWeapon.oid, count: 1 });
          } else {
            characterData[charIdx].builds[buildIdx].weapons[weaponIdx].count++;
          }

          // Update artifact set count
          characterData[charIdx].builds[buildIdx].count++;
        }

        characterData[charIdx].total++;
        // characterData[charIdx].avg_level = Math.floor(
        //   characterData[charIdx].avg_level + (level - characterData[charIdx].avg_level) / characterData[charIdx].total,
        // );
      } else {
        const constellations = new Array(7).fill(0);
        constellations[constellation] = 1;

        characterData.push({
          oid,
          constellations,
          builds: [
            {
              buildId: buildIdNum,
              weapons: [{ oid: charWeapon.oid, count: 1 }],
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
}
