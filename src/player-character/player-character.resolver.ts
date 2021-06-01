import { Args, Query, Resolver } from '@nestjs/graphql';

import { PlayerCharacter } from './player-character.model';
import { PlayerCharacterService } from './player-character.service';

@Resolver()
export class PlayerCharacterResolver {
  constructor(private playerCharacterService: PlayerCharacterService) {}

  @Query(() => [PlayerCharacter])
  async PlayerCharacters(@Args('ids') ids: number[]) {
    this.playerCharacterService.getByIds(ids);
  }
}
