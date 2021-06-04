import { Model, ObjectId } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';

interface IPartyData {
  party: ObjectId[];
  count: number;
}

export interface IAbyssData {
  [floorLevel: string]: IPartyData[][];
}

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,
  ) {}

  list(filter: ListAbyssBattleInput) {
    const { floorLevels, charIds } = filter;
    const queryFilter = {};

    if (!floorLevels && floorLevels.length > 0) {
      queryFilter['floor_level'] = { $in: floorLevels };
    }

    if (!charIds && charIds.length > 0) {
      queryFilter['oid'] = { $in: charIds };
    }

    return this.abyssBattleModel.find(queryFilter).exec();
  }

  // async aggregate(filter: ListAbyssBattleInput) {
  //   // const floors = ['9', '10', '11', '12'];
  //   // const levels = ['1', '2', '3'];
  //   // const battleNum = 2;

  //   // const abyssData: IAbyssData = {};
  //   // _.forEach(floors, (floor) => {
  //   //   _.forEach(levels, (level) => {
  //   //     abyssData[`${floor}-${level}`] = new Array(battleNum).fill({ party: [], count: 0 });
  //   //   });
  //   // });

  //   // const battles = await this.list(filter);

  //   // _.forEach(battles, ({ floor_level, parties }) => {
  //   //   _.forEach(parties, (party, i) => {
  //   //     const partyIdx = _.findIndex(abyssData[floor_level][i], (_battle) => {
  //   //       return _battle.party.sort() === party.sort();
  //   //     });

  //   //     if (partyIdx > -1) {
  //   //     } else {
  //   //     }
  //   //   });
  //   // });

  //   const { floorLevels, charIds } = filter;
  //   const queryFilter = {};

  //   if (!floorLevels && floorLevels.length > 0) {
  //     queryFilter['floor_level'] = { $in: floorLevels };
  //   }

  //   if (!charIds && charIds.length > 0) {
  //     queryFilter['oid'] = { $in: charIds };
  //   }

  //   await this.abyssBattleModel.aggregate([
  //     { $match: queryFilter },
  //     {
  //       $or: [{ members: ['some id 1', 'some id 2'] }, { members: ['some id 2', 'some id 1'] }],
  //     },
  //   ]);
  // }
}
