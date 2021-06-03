import { Artifact } from 'src/artifact/artifact.model';
import { PlayerCharacter } from 'src/player-character/player-character.model';
import { Weapon } from 'src/weapon/weapon.model';

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

  @ResolveField(() => [[PlayerCharacter]])
  async characters(@Parent() abyssBattle: AbyssBattleDocument) {
    const battle = await abyssBattle
      .populate({
        path: 'parties',
        model: PlayerCharacter.name,
        populate: [
          {
            path: 'artifacts',
            model: Artifact.name,
          },
          {
            path: 'weapon',
            model: Weapon.name,
          },
        ],
      })
      .execPopulate();
    // console.log(battle.parties);
    return battle.parties;
  }
}
