import { PlayerCharacter } from 'src/player-character/player-character.model';

import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';
import { AbyssBattleService } from './abyss-battle.service';

@Resolver(() => AbyssBattle)
export class AbyssBattleResolver {
  constructor(private abyssBattleService: AbyssBattleService) {}

  @Query(() => [AbyssBattle])
  async abyssBattles(@Args('floorLevels') floorLevels: string[]) {
    return this.abyssBattleService.getByFloorLevels(floorLevels);
  }

  @ResolveField(() => [PlayerCharacter])
  async parties(@Parent() abyssBattle: AbyssBattleDocument, @Args('populate') populate: boolean) {
    if (populate)
      await abyssBattle.populate({ path: 'parties', model: PlayerCharacter.name }).execPopulate();

    return abyssBattle.parties;
  }
}
