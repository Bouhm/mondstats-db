import { Args, Query, Resolver } from '@nestjs/graphql';

import { Artifact } from './artifact.model';
import { ArtifactService } from './artifact.service';

@Resolver(() => Artifact)
export class ArtifactResolver {
  constructor(private artifactService: ArtifactService) {}

  @Query(() => [Artifact])
  async artifacts(@Args('ids') ids: number[]) {
    return this.artifactService.getByIds(ids);
  }
}
