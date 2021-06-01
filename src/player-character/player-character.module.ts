import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PlayerCharacter, PlayerCharacterSchema } from './player-character.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlayerCharacter.name, schema: PlayerCharacterSchema },
    ]),
  ],
})
export class PlayerCharacterModule {}
