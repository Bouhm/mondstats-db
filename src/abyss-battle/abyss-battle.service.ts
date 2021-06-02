import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,
  ) {}

  getByFloorLevels(floorLevels: string[]) {
    return this.abyssBattleModel.find({ floor_level: { $in: floorLevels } }).exec();
  }
}
