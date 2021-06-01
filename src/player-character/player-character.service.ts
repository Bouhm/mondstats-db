import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

@Injectable()
export class PlayerCharacterService {
  constructor(
    @InjectModel(PlayerCharacter.name)
    private PlayerCharacterModel: Model<PlayerCharacterDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<PlayerCharacterDocument>,
    update: UpdateQuery<PlayerCharacterDocument>,
    options: QueryOptions,
  ) {
    return this.PlayerCharacterModel.findOneAndUpdate(filter, update, options);
  }
}
