import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListPlayerCharacterInput {
  @Field(() => [Number], { nullable: true })
  charIds?: number[];

  @Field(() => [Number], { nullable: true })
  uids?: number[];
}
