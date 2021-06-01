import dotenv from 'dotenv';
import { join } from 'path';
import { AbyssBattleModule } from 'src/abyss-battle/abyss-battle.module';
import { ArtifactSetModule } from 'src/artifact-set/artifact-set.module';
import { ArtifactModule } from 'src/artifact/artifact.module';
import { CharacterModule } from 'src/character/character.module';
import { PlayerCharacterModule } from 'src/player-character/player-character.module';
import { PlayerModule } from 'src/player/player.module';
import { WeaponModule } from 'src/weapon/weapon.module';

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

dotenv.config();
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`;

@Module({
  imports: [
    MongooseModule.forRoot(URI),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      debug: false,
    }),
    AbyssBattleModule,
    ArtifactModule,
    ArtifactSetModule,
    CharacterModule,
    PlayerModule,
    PlayerCharacterModule,
    WeaponModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
