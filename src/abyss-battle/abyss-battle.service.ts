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

  getTopParties(characterIds = [], limit = 100) {
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
            party: '$party.character',
            star: 1,
          },
        },
        {
          $match: characterIds.length ? { party: { $all: characterIds } } : {},
        },
        {
          $group: {
            _id: '$party',
            count: {
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
          $project: {
            _id: 0,
            party: {
              $map: {
                input: '$_id.party',
                as: 'charId',
                in: {
                  $toString: '$$charId',
                },
              },
            },
            count: 1,
            avgStar: 1,
            winCount: 1,
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

  async getTopFloorParties(floorLevel: string, battleIndex: number, characterIds = [], limit = 100) {
    return this.abyssBattleModel
      .aggregate([
        {
          $match: {
            floor_level: floorLevel,
            battle_index: battleIndex,
          },
        },
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
            party: '$party.character',
            floor_level: 1,
            battle_index: 1,
            star: 1,
          },
        },
        {
          $match: characterIds.length ? { party: { $all: characterIds } } : {},
        },
        {
          $group: {
            _id: {
              party: '$party',
              floorLevel: '$floor_level',
              battleIndex: '$battle_index',
            },
            count: {
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
          $project: {
            _id: 0,
            party: {
              $map: {
                input: '$_id.party',
                as: 'charId',
                in: {
                  $toString: '$$charId',
                },
              },
            },
            battle: {
              $concat: [
                '$_id.floorLevel',
                '-',
                {
                  $toString: '$_id.battleIndex',
                },
              ],
            },
            count: 1,
            avgStar: 1,
            winCount: 1,
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

  getBuildAbyssStats(artifactSets: any = [], weaponId = '', characterId = '', limit = 100) {
    const partyMatch: any = {};
    const buildMatch: any = {};

    if (characterId) {
      partyMatch.party = {
        $elemMatch: {
          character: {
            $all: [characterId],
          },
        },
      };
      buildMatch.character = { $all: [characterId] };
    }
    if (artifactSets.length) buildMatch.artifactSets = { $all: artifactSets };
    if (weaponId) buildMatch.weapon = weaponId;

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
              artifactSets: '$party.artifactSets',
              weapon: '$party.weapon',
              character: '$party.character',
            },
            star: 1,
          },
        },
        {
          $match: partyMatch,
        },
        {
          $unwind: '$party',
        },
        {
          $group: {
            _id: {
              weapon: '$party.weapon',
              artifactSets: '$party.artifactSets',
            },
            count: {
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

  getArtifactSetsAbyssStats(limit = 100) {
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
              artifactSets: '$party.artifactSets',
              weapon: '$party.weapon',
              character: '$party.character',
            },
            star: 1,
          },
        },
        {
          $unwind: '$party',
        },
        {
          $group: {
            _id: '$party.artifactSets',
            count: {
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

  async getArtifactSetTotals() {
    return this.abyssBattleModel
      .aggregate([
        {
          $unwind: '$party',
        },
        {
          $group: {
            _id: '$_id',
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .option(options)
      .exec();
  }

  getWeaponAbyssStats(limit = 100) {
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
            party: '$party.weapon',
            star: 1,
          },
        },
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'weapons',
            localField: 'party.weapon',
            foreignField: '_id',
            as: 'weapon',
          },
        },
        {
          $group: {
            _id: '$weapon._id',
            type: '$weapon.type_name',
            count: {
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

  getWeaponTypeTotals() {
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
              artifactSets: '$party.artifactSets',
              weapon: '$party.weapon',
              character: '$party.character',
            },
            star: 1,
          },
        },
        {
          $unwind: '$party',
        },
        {
          $lookup: {
            from: 'weapons',
            localField: 'party.weapon',
            foreignField: '_id',
            as: 'weapon',
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
          $sort: {
            count: -1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getStats() {
    return this.abyssBattleModel.find().lean().countDocuments();
  }
}
