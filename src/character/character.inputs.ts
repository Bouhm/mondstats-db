import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListCharacterInput {
  @Field(() => [Number], { nullable: true })
  oids?: number[];
}
