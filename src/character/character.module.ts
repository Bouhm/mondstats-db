import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Character, CharacterSchema } from './character.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
    ]),
  ],
})
export class CharacterModule {}
