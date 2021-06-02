import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListPlayerInput } from './player.inputs';
import { Player, PlayerDocument } from './player.model';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Player.name)
    private playerModel: Model<PlayerDocument>,
  ) {}

  list(filter: ListPlayerInput) {
    return this.playerModel.find({ ...filter }).exec();
  }
}
