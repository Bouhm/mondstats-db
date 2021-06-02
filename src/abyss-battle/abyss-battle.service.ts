import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,
  ) {}

  list(filters: ListAbyssBattleInput) {
    return this.abyssBattleModel.find({ ...filters }).exec();
  }
}
