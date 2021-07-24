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
  total_battles: number;

  @Field(() => Number)
  total_wins: number;
<<<<<<< HEAD

=======
  
>>>>>>> ae545d83283b9e19104d1857440f902d41913d17
  @Field(() => Number)
  schedule_id: number;

  @Field(() => Number)
  @Prop({ required: true })
  total_star: number;
}

export type PlayerDocument = Player & Document;

export const PlayerSchema = SchemaFactory.createForClass(Player);
export default mongoose.model<PlayerDocument>(Player.name, PlayerSchema);
