import _ from 'lodash';
import { Model } from 'mongoose';
import { Affix, ArtifactSet, ArtifactSetDocument } from 'src/artifact-set/artifact-set.model';

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

    @InjectModel(ArtifactSet.name)
    private artifactSetModel: Model<ArtifactSetDocument>,
  ) {}

  list(filter: ListPlayerCharacterInput) {
    const queryFilter = {};

    if (queryFilter) {
      const { charIds, uids } = filter;
      if (charIds && charIds.length > 0) {
        queryFilter['oid'] = { $in: charIds };
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
    const playerSets: any = {};

    _.forEach(playerCharacters, ({ oid, weapon, artifacts }) => {
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

      const artifactSetCombinations: { id: number; activation_number: number }[] = [];

      _.forIn(playerSets, (set, id) => {
        const activationNum = _getActivationNumber(set.count, set.affixes);

        if (activationNum > 0) {
          artifactSetCombinations.push({
            id: parseInt(id),
            activation_number: activationNum
          });
        }
      });

      if (data.characters[charDat.id]) {
        data.characters[charDat.id].constellations[cNum]++;
      
        const buildIdx = _.findIndex(data.characters[charDat.id].builds, { buildId: buildIdNum.toString() })
        if (buildIdx < 0) {
          data.characters[charDat.id].builds.push({
            buildId: buildIdNum.toString(),
            weapons: [{ id: char.weapon.id, count: 1 }],
            artifacts: artifactSetCombinations,
            count: 1
          })
        } else {
          // Update weapons
          const weaponIdx = _.findIndex(data.characters[charDat.id].builds[buildIdx].weapons, { id: char.weapon.id })
          if (weaponIdx < 0) {
            data.characters[charDat.id].builds[buildIdx].weapons.push({ id: char.weapon.id, count: 1 })
          } else {
            data.characters[charDat.id].builds[buildIdx].weapons[weaponIdx].count++;
          }
    
          // Update artifact set count
          data.characters[charDat.id].builds[buildIdx].count++;
        }
    
        data.characters[charDat.id].total++;
        data.characters[charDat.id].avgLevel = Math.floor(
          (data.characters[charDat.id].avgLevel * data.characters[charDat.id].total + char.level) / (data.characters[charDat.id].total)
        );
      } else {
        data.characters[charDat.id] = {
          id: charDat.id,
          name: charDat.name,
          constellations,
          avgLevel: char.level,
          builds: [{
            buildId: buildIdNum.toString(),
            weapons: [{ id: char.weapon.id, count: 1 }],
            artifacts: artifactSetCombinations,
            count: 1
          }],
          total: 1
        }
      }
  
    });
  }
}
