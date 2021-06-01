import { Document, Schema as MongooseSchema } from 'mongoose';
import { Artifact } from 'src/artifact/artifact.model';
import { Character } from 'src/character/character.model';
import { Player } from 'src/player/player.model';
import { Weapon } from 'src/weapon/weapon.model';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class PlayerCharacter {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  id: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Character.name,
    required: true,
  })
  character: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Player.name,
    required: true,
  })
  player: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [
      {
        type: MongooseSchema.Types.ObjectId,
        ref: Artifact.name,
        required: true,
      },
    ],
  })
  artifacts: MongooseSchema.Types.ObjectId[];

  @Prop({ required: true })
  constellation: number;

  @Prop({ required: true })
  element: string;

  @Prop({ required: true })
  fetter: number;

  @Prop({ required: true })
  level: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Weapon.name,
    required: true,
  })
  weapon: MongooseSchema.Types.ObjectId;
}

export type PlayerCharacterDocument = PlayerCharacter & Document;

export const PlayerCharacterSchema = SchemaFactory.createForClass(PlayerCharacter);
