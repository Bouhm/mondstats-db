import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListCharacterInput } from './character.inputs';
import { Character, CharacterDocument } from './character.model';

@Injectable()
export class CharacterService {
  constructor(
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
  ) {}

  list(filters: ListCharacterInput) {
    return this.characterModel.find({ ...filters }).exec();
  }
}
