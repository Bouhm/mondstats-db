import { Args, Query, Resolver } from '@nestjs/graphql';

import { ListArtifactSetInput } from './artifact-set.inputs';
import { ArtifactSet } from './artifact-set.model';
import { ArtifactSetService } from './artifact-set.service';

@Resolver(() => ArtifactSet)
export class ArtifactSetResolver {
  constructor(private artifactSetService: ArtifactSetService) {}

  @Query(() => [ArtifactSet])
  async artifacts(@Args('filter') filter: ListArtifactSetInput) {
    return this.artifactSetService.list(filter);
  }
}
