import { Args, Query, Resolver } from '@nestjs/graphql';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle } from './abyss-battle.model';
import { AbyssBattleService } from './abyss-battle.service';

@Resolver(() => AbyssBattle)
export class AbyssBattleResolver {
  constructor(private abyssBattleService: AbyssBattleService) {}

  @Query(() => [AbyssBattle])
  async abyssBattles(@Args('filter') filter: ListAbyssBattleInput) {
    return this.abyssBattleService.list(filter);
  }

  // @Query(() => [PlayerCharacter])
  // async partyStats(@Args('filter') filter: ListAbyssBattleInput) {
  // }
}
