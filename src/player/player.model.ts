import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class Player {
  @Field(() => String)
  _id: MongooseSchema.Types.ObjectId;

  @Field(() => Number)
  @Prop({ required: true, unique: true })
  uid: number;

  @Field(() => Number)
  @Prop({ required: true })
  total_star: number;
}

export type PlayerDocument = Player & Document;
export const PlayerSchema = SchemaFactory.createForClass(Player);
export default mongoose.model<PlayerDocument>(Player.name, PlayerSchema);
