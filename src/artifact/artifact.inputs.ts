import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ListArtifactInput {
  @Field(() => [Number], { nullable: true })
  oids?: number[];
}
