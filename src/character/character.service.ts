import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Character, CharacterDocument } from './character.model';

@Injectable()
export class CharacterService {
  constructor(
    @InjectModel(Character.name)
    private CharacterModel: Model<CharacterDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<CharacterDocument>,
    update: UpdateQuery<CharacterDocument>,
    options: QueryOptions,
  ) {
    return this.CharacterModel.findOneAndUpdate(filter, update, options);
  }
}
