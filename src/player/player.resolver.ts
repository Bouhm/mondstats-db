import { Args, Query, Resolver } from '@nestjs/graphql';

import { Player } from './player.model';
import { PlayerService } from './player.service';

@Resolver()
export class PlayerResolver {
  constructor(private playerService: PlayerService) {}

  @Query(() => [Player])
  async Players(@Args('ids') ids: number[]) {
    return this.playerService.getByIds(ids);
  }
}
