import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListPlayerCharacterInput {
  @Field(() => [Number], { nullable: true })
  oids?: number[];

  @Field(() => [Number], { nullable: true })
  uids?: number[];
}
