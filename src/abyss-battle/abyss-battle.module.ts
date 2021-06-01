import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AbyssBattle, AbyssBattleSchema } from './abyss-battle.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AbyssBattle.name, schema: AbyssBattleSchema }]),
  ],
})
export class AbyssBattleModule {}
