import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@ObjectType('BuildWeapon')
export class BuildWeapon {
  @Field(() => String)
  _id: string;

  @Field(() => Number)
  count: number;
}

@ObjectType('BuildSet')
export class BuildSet {
  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ArtifactSet',
    required: true,
  })
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  activation_number: number;
}

@ObjectType('BuildStats')
export class BuildStats {
  @Field(() => [BuildWeapon])
  weapons: BuildWeapon[];

  @Field(() => [BuildSet])
  artifacts: BuildSet[];

  @Field(() => Number)
  count: number;
}

@ObjectType()
export class TeamStats {
  @Field(() => [PlayerCharacter])
  party: MongooseSchema.Types.ObjectId[];

  @Field(() => Number)
  count: number;
}

@ObjectType('CharacterBuildStats')
export class CharacterBuildStats {
  @Field(() => String)
  char_id: string;

  @Field(() => [BuildStats])
  builds: BuildStats[];

  @Field(() => [Number])
  constellations: number[];

  @Field(() => [TeamStats])
  teams: TeamStats[];

  @Field(() => Number)
  total?: number;
}

@ObjectType()
@Schema({ timestamps: true })
export class PlayerCharacter {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Character',
    required: true,
  })
  character: MongooseSchema.Types.ObjectId;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Player',
    required: true,
  })
  player: MongooseSchema.Types.ObjectId;

  @Field(() => [String])
  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    ref: 'Artifact',
    // required: true,
  })
  artifacts: MongooseSchema.Types.ObjectId[];

  @Field(() => [String])
  @Prop({ required: true })
  artifactSets: BuildSet[];

  @Field(() => Number)
  @Prop({ required: true })
  constellation: number;

  @Field(() => Number)
  @Prop({ required: true })
  fetter: number;

  @Field(() => Number)
  @Prop({ required: true })
  level: number;

  @Field(() => Number)
  strongest_strike: number;

  @Field(() => String)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Weapon',
    required: true,
  })
  weapon: MongooseSchema.Types.ObjectId;
}

export type PlayerCharacterDocument = PlayerCharacter & Document;
export const PlayerCharacterSchema = SchemaFactory.createForClass(PlayerCharacter);
export default mongoose.model<PlayerCharacterDocument>(PlayerCharacter.name, PlayerCharacterSchema);
