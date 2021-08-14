import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@ObjectType()
@Schema({ _id: false })
export class Token {
  @Field(() => String)
  @Prop({ required: true, unique: true })
  value: string;

  @Field(() => Date)
  @Prop({ required: true })
  used: Date;
}

export type TokenDocument = Token & Document;
export const TokenSchema = SchemaFactory.createForClass(Token);
export default mongoose.model<TokenDocument>(Token.name, TokenSchema);
