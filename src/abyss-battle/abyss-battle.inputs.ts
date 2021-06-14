import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListAbyssBattleInput {
  @Field(() => Boolean, { nullable: true })
  f2p?: boolean;

  @Field(() => [String], { nullable: true })
  floorLevels?: string[];

  @Field(() => [Number], { nullable: true })
  charIds?: number[];
}
