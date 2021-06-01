import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Character, CharacterDocument } from './character.model';

@Injectable()
export class CharacterService {
  constructor(
    @InjectModel(Character.name)
    private CharacterModel: Model<CharacterDocument>,
  ) {}
}
