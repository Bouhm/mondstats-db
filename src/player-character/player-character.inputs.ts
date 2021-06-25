import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListPlayerCharacterInput {
  @Field(() => Boolean, { nullable: true })
  f2p?: boolean;

  @Field(() => [String], { nullable: true })
  charIds?: string[];

  @Field(() => [Number], { nullable: true })
  uids?: number[];
}
