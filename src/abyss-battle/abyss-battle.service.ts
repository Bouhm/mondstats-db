import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private AbyssBattleModel: Model<AbyssBattleDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<AbyssBattleDocument>,
    update: UpdateQuery<AbyssBattleDocument>,
    options: QueryOptions,
  ) {
    return this.AbyssBattleModel.findOneAndUpdate(filter, update, options);
  }
}
