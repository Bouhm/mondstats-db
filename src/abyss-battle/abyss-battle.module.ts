import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AbyssBattle, AbyssBattleSchema } from './abyss-battle.model';
import { AbyssBattleResolver } from './abyss-battle.resolver';
import { AbyssBattleService } from './abyss-battle.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AbyssBattle.name, schema: AbyssBattleSchema }])],
  providers: [AbyssBattleService, AbyssBattleResolver],
})
export class AbyssBattleModule {}
