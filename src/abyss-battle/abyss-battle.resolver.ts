import { PlayerCharacter } from 'src/player-character/player-character.model';

import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';
import { AbyssBattleService } from './abyss-battle.service';

@Resolver(() => AbyssBattle)
export class AbyssBattleResolver {
  constructor(private abyssBattleService: AbyssBattleService) {}

  @Query(() => [AbyssBattle])
  async abyssBattles(@Args('filter', { nullable: true }) filter?: ListAbyssBattleInput) {
    return this.abyssBattleService.list(filter);
  }

  @ResolveField()
  async parties(@Parent() abyssBattle: AbyssBattleDocument) {
    const battle = await abyssBattle
      .populate({ path: 'parties', model: PlayerCharacter.name })
      .execPopulate();

    return battle.parties;
  }
}
