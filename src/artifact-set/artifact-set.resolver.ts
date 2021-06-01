import { Args, Query, Resolver } from '@nestjs/graphql';

import { ArtifactSet } from './artifact-set.model';
import { ArtifactSetService } from './artifact-set.service';

@Resolver(() => ArtifactSet)
export class ArtifactSetResolver {
  constructor(private artifactSetService: ArtifactSetService) {}

  @Query(() => [ArtifactSet])
  async ArtifactSets(@Args('ids') ids: number[]) {
    this.artifactSetService.getByIds(ids);
  }
}
