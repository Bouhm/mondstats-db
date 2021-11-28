import { find, findIndex, forEach, isEqual, map } from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Affix } from '../artifact-set/artifact-set.model';
// import abyssBattles from '../data/abyssBattles.json';
import { ListPlayerCharacterInput } from './player-character.inputs';
import { PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

const BP_WEAPONS = [
  'The Black Sword',
  'Serpent Spine',
  'Solar Pearl',
  'The Viridescent Hunt',
  'Deathmatch',
];

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

  getCharacterBuilds(characterId = '', limit = 10) {
    return this.playerCharacterModel
      .aggregate([
        {
          $match: {
            character: characterId,
          },
        },
        {
          $group: {
            _id: {
              weapon: '$weapon',
              artifactSetBuild: '$artifactSetBuild',
              character: '$character',
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: {
              artifactSetBuild: '$_id.artifactSetBuild',
              character: '$_id.character',
            },
            weapons: {
              $push: {
                _id: '$_id.weapon',
                count: '$count',
              },
            },
          },
        },
        { $unwind: '$weapons' },
        { $sort: { 'weapons.count': -1 } },
        { $group: { _id: '$_id', count: { $sum: '$weapons.count' }, weapons: { $push: '$weapons' } } },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            artifactSetBuild: '$_id.artifactSetBuild',
            characterId: '$_id.character',
            weapons: {
              $slice: ['$weapons', 0, 10],
            },
          },
        },
        {
          $lookup: {
            from: 'artifactsetbuilds',
            localField: 'artifactSetBuild',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  sets: 1,
                },
              },
            ],
            as: 'artifactSets',
          },
        },
        {
          $set: {
            artifactSets: {
              $arrayElemAt: ['$artifactSets.sets', 0],
            },
          },
        },
        {
          $project: {
            _id: 0,
            characterId: 1,
            artifactSetBuild: 1,
            artifactSets: 1,
            weapons: 1,
          },
        },
      ])
      .option(options)
      .exec();
  }

  getCharacterTotals(limit = 100) {
    return this.playerCharacterModel
      .aggregate([
        {
          $group: {
            _id: '$character',
            total: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .option(options)
      .exec();
  }

  getWeaponTypeTotals(limit = 100) {
    return this.playerCharacterModel
      .aggregate([
        {
          $lookup: {
            from: 'weapons',
            localField: 'weapon',
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
          $group: {
            _id: '$weapon.type_name',
            total: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .option(options)
      .exec();
  }

  getWeaponTotals(limit = 1000) {
    return this.playerCharacterModel
      .aggregate([
        {
          $group: {
            _id: '$weapon',
            total: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
        {
          $limit: limit,
        },
      ])
      .option(options)
      .exec();
  }

  getArtifactSetTotals(limit = 1000) {
    return this.playerCharacterModel
      .aggregate([
        {
          $group: {
            _id: '$artifactSetBuild',
            total: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'artifactsetbuilds',
            localField: '_id',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  sets: 1,
                },
              },
            ],
            as: 'artifactSets',
          },
        },
        {
          $set: {
            artifactSets: {
              $arrayElemAt: ['$artifactSets.sets', 0],
            },
          },
        },
      ])
      .option(options)
      .exec();
  }

  getCount() {
    return this.playerCharacterModel.find().lean().countDocuments();
  }
}
