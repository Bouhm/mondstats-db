import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListArtifactSetInput {
  @Field(() => [Number], { nullable: true })
  oids?: number[];
}
