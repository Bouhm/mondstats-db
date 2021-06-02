import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListPlayerCharacterInput } from './player-character.inputs';
import { PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

@Injectable()
export class PlayerCharacterService {
  constructor(
    @InjectModel(PlayerCharacter.name)
    private playerCharacterModel: Model<PlayerCharacterDocument>,
  ) {}

  list(filters: ListPlayerCharacterInput) {
    return this.playerCharacterModel.find({ ...filters }).exec();
  }
}
