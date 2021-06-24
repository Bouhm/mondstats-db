import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListPlayerCharacterInput {
  @Field(() => Boolean, { nullable: true })
  f2p?: boolean;

  @Field(() => [Number], { nullable: true })
  charIds?: number[];

  @Field(() => [Number], { nullable: true })
  uids?: number[];
}
