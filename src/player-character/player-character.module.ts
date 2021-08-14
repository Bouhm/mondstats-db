import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PlayerCharacter, PlayerCharacterSchema } from './player-character.model';
import { PlayerCharacterResolver } from './player-character.resolver';
import { PlayerCharacterService } from './player-character.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PlayerCharacter.name, schema: PlayerCharacterSchema }])],
  providers: [PlayerCharacterService, PlayerCharacterResolver],
})
export class PlayerCharacterModule {}
