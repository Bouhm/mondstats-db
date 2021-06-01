import { Args, Query, Resolver } from '@nestjs/graphql';

import { Artifact } from './artifact.model';
import { ArtifactService } from './artifact.service';

@Resolver()
export class ArtifactResolver {
  constructor(private artifactService: ArtifactService) {}

  @Query(() => [Artifact])
  async Artifacts(@Args('ids') ids: number[]) {
    this.artifactService.getByIds(ids);
  }
}
