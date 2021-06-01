import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Player, PlayerDocument } from './player.model';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Player.name)
    private PlayerModel: Model<PlayerDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<PlayerDocument>,
    update: UpdateQuery<PlayerDocument>,
    options: QueryOptions,
  ) {
    return this.PlayerModel.findOneAndUpdate(filter, update, options);
  }
}
