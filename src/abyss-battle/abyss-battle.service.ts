import { difference, find, forEach, includes, map } from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Affix } from '../artifact-set/artifact-set.model';
// import { Character, CharacterDocument } from '../character/character.model';
import { PlayerCharacter } from '../player-character/player-character.model';
import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';

function _getActivationNumber(battleCount: number, affixes: Affix[]) {
  const activations = map(affixes, (effect) => effect.activation_number);

  let activation = 0;
  forEach(activations, (activation_num) => {
    if (battleCount >= activation_num) {
      activation = activation_num;
    }
  });

  return activation;
}

const options = { allowDiskUse: true };

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

  getTopParties(characterId = '', limit = 20) {
    return this.abyssBattleModel
      .aggregate([
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  character: 1,
                },
              },
              {
                $sort: {
                  character: 1,
                },
              },
            ],
            as: 'party',
          },
        },
        {
          $project: {
            party: '$party.character',
            star: 1,
          },
        },
        {
          $match: characterId ? { party: { $all: [characterId] } } : {},
        },
        {
          $group: {
            _id: '$party',
            battleCount: {
              $sum: 1,
            },
            avgStar: {
              $avg: '$star',
            },
            winCount: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ['$star', 3],
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            battleCount: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            party: '$_id',
            avgStar: 1,
            winCount: 1,
            battleCount: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getTopFloorParties(floor_level: string, battle_index: number, characterId = '', limit = 20) {
    return this.abyssBattleModel
      .aggregate([
        {
          $match: {
            floor_level,
            battle_index,
          },
        },
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  character: 1,
                },
              },
              {
                $sort: {
                  character: 1,
                },
              },
            ],
            as: 'party',
          },
        },
        {
          $project: {
            _id: 0,
            party: '$party.character',
            floor_level: 1,
            battle_index: 1,
            star: 1,
          },
        },
        {
          $match: characterId ? { party: { $all: [characterId] } } : {},
        },
        {
          $group: {
            _id: {
              party: '$party',
              floor_level: '$floor_level',
              battle_index: '$battle_index',
            },
            battleCount: {
              $sum: 1,
            },
            avgStar: {
              $avg: '$star',
            },
            winCount: {
              $sum: {
                $cond: { if: { $eq: ['$star', 3] }, then: 1, else: 0 },
              },
            },
          },
        },
        {
          $sort: {
            battleCount: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            party: '$_id.party',
            floorLevel: '$_id.floor_level',
            battleIndex: '$_id.battle_index',
            _id: 0,
            battleCount: 1,
            avgStar: 1,
            winCount: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getCharacterBuildAbyssStats(characterId: string, limit = 10) {
    return this.abyssBattleModel
      .aggregate([
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  character: 1,
                  weapon: 1,
                  artifactSetBuild: 1,
                },
              },
            ],
            as: 'playerCharacter',
          },
        },
        {
          $project: {
            _id: 0,
            playerCharacter: {
              $arrayElemAt: ['$playerCharacter', 0],
            },
            star: 1,
          },
        },
        {
          $project: {
            characterId: '$playerCharacter.character',
            weaponId: '$playerCharacter.weapon',
            artifactSetBuildId: '$playerCharacter.artifactSetBuild',
            star: 1,
          },
        },
        {
          $match: {
            characterId,
          },
        },
        {
          $group: {
            _id: {
              characterId: '$characterId',
              weaponId: '$weaponId',
              artifactSetBuildId: '$artifactSetBuildId',
            },
            battleCount: {
              $sum: 1,
            },
            avgStar: {
              $avg: '$star',
            },
            winCount: {
              $sum: {
                $cond: { if: { $eq: ['$star', 3] }, then: 1, else: 0 },
              },
            },
            star: {
              $sum: '$star',
            },
          },
        },
        {
          $group: {
            _id: {
              artifactSetBuildId: '$_id.artifactSetBuildId',
              characterId: '$_id.characterId',
            },
            weapons: {
              $push: {
                weaponId: '$_id.weaponId',
                battleCount: '$battleCount',
                avgStar: '$avgStar',
                winCount: '$winCount',
                star: '$star',
              },
            },
          },
        },
        { $unwind: '$weapons' },
        { $sort: { 'weapons.battleCount': -1 } },
        {
          $group: {
            _id: '$_id',
            battleCount: {
              $sum: '$weapons.battleCount',
            },
            winCount: {
              $sum: '$weapons.winCount',
            },
            star: {
              $sum: '$weapons.star',
            },
            weapons: { $push: '$weapons' },
          },
        },
        {
          $sort: {
            battleCount: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            artifactSetBuildId: '$_id.artifactSetBuildId',
            characterId: '$_id.characterId',
            battleCount: 1,
            totalStars: '$star',
            winCount: 1,
            _id: 0,
            weapons: {
              $slice: ['$weapons', 0, 10],
            },
          },
        },
      ])
      .option(options)
      .exec();
  }

  getArtifactSetAbyssStats() {
    return this.abyssBattleModel
      .aggregate([
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  artifactSetBuild: 1,
                },
              },
            ],
            as: 'playerCharacter',
          },
        },
        {
          $project: {
            _id: 0,
            playerCharacter: {
              $arrayElemAt: ['$playerCharacter', 0],
            },
            star: 1,
          },
        },
        {
          $project: {
            artifactSetBuildId: '$playerCharacter.artifactSetBuild',
            star: 1,
          },
        },
        {
          $group: {
            _id: '$artifactSetBuildId',
            battleCount: {
              $sum: 1,
            },
            avgStar: {
              $avg: '$star',
            },
            winCount: {
              $sum: {
                $cond: { if: { $eq: ['$star', 3] }, then: 1, else: 0 },
              },
            },
          },
        },
        {
          $sort: {
            battleCount: -1,
          },
        },
        {
          $project: {
            artifactSetBuildId: '$_id',
            _id: 0,
            battleCount: 1,
            avgStar: 1,
            winCount: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getCharacterAbyssStats(characterId: string, limit = 1000) {
    return this.abyssBattleModel
      .aggregate([
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  character: 1,
                },
              },
            ],
            as: 'playerCharacter',
          },
        },
        {
          $project: {
            _id: 0,
            characterId: '$playerCharacter.character',
            star: 1,
          },
        },
        {
          $match: {
            characterId,
          },
        },
        {
          $group: {
            _id: '$characterId',
            battleCount: {
              $sum: 1,
            },
            avgStar: {
              $avg: '$star',
            },
            winCount: {
              $sum: {
                $cond: { if: { $eq: ['$star', 3] }, then: 1, else: 0 },
              },
            },
          },
        },
        {
          $sort: {
            battleCount: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            characterId: '$_id',
            _id: 0,
            battleCount: 1,
            avgStar: 1,
            winCount: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getCharacterAbyssConstellationCount() {
    return this.abyssBattleModel.aggregate([
      {
        $unwind: '$party',
      },
      {
        $lookup: {
          from: 'playercharacters',
          localField: 'party',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 0,
                character: 1,
                constellation: 1,
              },
            },
          ],
          as: 'playerCharacter',
        },
      },
      {
        $project: {
          _id: 0,
          playerCharacter: {
            $arrayElemAt: ['$playerCharacter', 0],
          },
        },
      },
      {
        $group: {
          _id: {
            characterId: '$playerCharacter.character',
            constellation: '$playerCharacter.constellation',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: '$_id.characterId',
          constellations: {
            $push: {
              constellation: '$_id.constellation',
              count: '$count',
            },
          },
        },
      },
      {
        $project: {
          characterId: '$_id',
          constellations: 1,
          _id: 0,
        },
      },
    ]);
  }

  getWeaponTypeAbyssTotals() {
    return this.abyssBattleModel
      .aggregate([
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  weapon: 1,
                },
              },
            ],
            as: 'playerCharacter',
          },
        },
        {
          $project: {
            _id: 0,
            playerCharacter: {
              $arrayElemAt: ['$playerCharacter', 0],
            },
            star: 1,
          },
        },
        {
          $project: {
            weaponId: '$playerCharacter.weapon',
            star: 1,
          },
        },
        {
          $lookup: {
            from: 'weapons',
            localField: 'weaponId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  type_name: 1,
                },
              },
            ],
            as: 'weapon',
          },
        },
        {
          $project: {
            weapon: {
              $arrayElemAt: ['$weapon', 0],
            },
            star: 1,
          },
        },
        {
          $group: {
            _id: '$weapon.type_name',
            total: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            weaponType: '$_id',
            _id: 0,
            total: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getWeaponAbyssStats(limit = 1000) {
    return this.abyssBattleModel
      .aggregate([
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'playercharacters',
            localField: 'party',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  weapon: 1,
                },
              },
            ],
            as: 'playerCharacter',
          },
        },
        {
          $project: {
            _id: 0,
            playerCharacter: {
              $arrayElemAt: ['$playerCharacter', 0],
            },
            star: 1,
          },
        },
        {
          $project: {
            weaponId: '$playerCharacter.weapon',
            star: 1,
          },
        },
        {
          $group: {
            _id: '$weaponId',
            battleCount: {
              $sum: 1,
            },
            avgStar: {
              $avg: '$star',
            },
            winCount: {
              $sum: {
                $cond: { if: { $eq: ['$star', 3] }, then: 1, else: 0 },
              },
            },
          },
        },
        {
          $sort: {
            battleCount: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            weaponId: '$_id',
            _id: 0,
            battleCount: 1,
            avgStar: 1,
            winCount: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getCount() {
    return this.abyssBattleModel.find().lean().countDocuments();
  }
}
