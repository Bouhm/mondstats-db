import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Player, PlayerDocument } from './player.model';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Player.name)
    private playerModel: Model<PlayerDocument>,
  ) {}

  getByIds(ids: number[]) {
    return this.playerModel.find({ id: { $in: ids } }).exec();
  }
}
