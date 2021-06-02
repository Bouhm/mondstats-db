import { Args, Query, Resolver } from '@nestjs/graphql';

import { ArtifactSet } from './artifact-set.model';
import { ArtifactSetService } from './artifact-set.service';

@Resolver(() => ArtifactSet)
export class ArtifactSetResolver {
  constructor(private artifactSetService: ArtifactSetService) {}

  @Query(() => [ArtifactSet])
  async artifactSets(@Args('ids') ids: number[]) {
    return this.artifactSetService.getByIds(ids);
  }
}
