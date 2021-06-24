import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@ObjectType('BuildWeapon')
export class BuildWeapon {
  @Field(() => Number)
  oid: number;

  @Field(() => Number)
  count: number;
}

@ObjectType('BuildSet')
export class BuildSet {
  @Field(() => Number)
  oid: number;

  @Field(() => Number)
  activation_number: number;
}

@ObjectType('BuildStats')
export class BuildStats {
  @Field(() => Number)
  buildId: number;

  @Field(() => [BuildWeapon])
  weapons: BuildWeapon[];

  @Field(() => [BuildSet])
  artifacts: BuildSet[];

  @Field(() => Number)
  count: number;
}

@ObjectType('CharacterStats')
export class CharacterStats {
  // @Field(() => Number)
  // avg_level: number;
  @Field(() => Number)
  oid: number;

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
    ref: 'Weapon',
    required: true,
  })
  weapon: MongooseSchema.Types.ObjectId;
}

export type PlayerCharacterDocument = PlayerCharacter & Document;

export const PlayerCharacterSchema = SchemaFactory.createForClass(PlayerCharacter);

export default mongoose.model<PlayerCharacterDocument>(PlayerCharacter.name, PlayerCharacterSchema);
