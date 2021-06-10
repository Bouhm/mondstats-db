import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import { ArtifactSet } from 'src/artifact-set/artifact-set.model';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Artifact } from '../artifact/artifact.model';
import { Character } from '../character/character.model';
import { Player } from '../player/player.model';
import { Weapon } from '../weapon/weapon.model';

@ObjectType()
export class WeaponBuild {
  @Field(() => Number)
  oid: number;

  @Field(() => Number)
  count: number;
}

@ObjectType()
export class BuildStats {
  @Field(() => [WeaponBuild])
  weapons: WeaponBuild[];

  @Field(() => [ArtifactSet])
  artifacts: ArtifactSet[];

  @Field(() => Number)
  count: number;
}

@ObjectType()
export class CharacterStats {
  @Field(() => String)
  name: string;

  @Field(() => Number)
  oid: number;

  @Field(() => Number)
  avg_level: number;

  @Field(() => [BuildStats])
  builds: BuildStats[];

  @Field(() => [Number])
  constellations: number[];

  @Field(() => Number)
  total: number;
}

@ObjectType()
@Schema({ timestamps: true })
export class PlayerCharacter {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  @Prop({ required: true })
  oid: number;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Character.name,
    required: true,
  })
  character: MongooseSchema.Types.ObjectId;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Player.name,
    required: true,
  })
  player: MongooseSchema.Types.ObjectId;

  @Field(() => [String])
  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: Artifact.name,
    required: true,
  })
  artifacts: MongooseSchema.Types.ObjectId[];

  @Field(() => Number)
  @Prop({ required: true })
  constellation: number;

  @Field(() => Number)
  @Prop({ required: true })
  fetter: number;

  @Field(() => Number)
  @Prop({ required: true })
  level: number;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Weapon.name,
    required: true,
  })
  weapon: MongooseSchema.Types.ObjectId;
}

export type PlayerCharacterDocument = PlayerCharacter & Document;

export const PlayerCharacterSchema = SchemaFactory.createForClass(PlayerCharacter);

export default mongoose.model<PlayerCharacterDocument>(PlayerCharacter.name, PlayerCharacterSchema);
