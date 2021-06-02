import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListAbyssBattleInput {
  @Field(() => [String], { nullable: true })
  floorLevels?: string[];
}
