

import { Args, Query, Resolver } from '@nestjs/graphql';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssStats } from './abyss-battle.model';
import { AbyssBattleService } from './abyss-battle.service';

@Resolver(() => AbyssBattle)
export class AbyssBattleResolver {
  constructor(private abyssBattleService: AbyssBattleService) {}

  @Query(() => [AbyssBattle])
  async abyssBattles(@Args('filter', { nullable: true }) filter?: ListAbyssBattleInput) {
    return this.abyssBattleService.list(filter);
  }

  @Query(() => [AbyssStats])
  async abyssStats(@Args('filter', { nullable: true }) filter?: ListAbyssBattleInput) {
    return this.abyssBattleService.aggregate(filter);
  }
}
