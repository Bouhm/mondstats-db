import { Args, Query, Resolver } from '@nestjs/graphql';

import { ListPlayerCharacterInput } from './player-character.inputs';
import { PlayerCharacter } from './player-character.model';
import { PlayerCharacterService } from './player-character.service';

@Resolver()
export class PlayerCharacterResolver {
  constructor(private playerCharacterService: PlayerCharacterService) {}

  @Query(() => [PlayerCharacter])
  async playerCharacters(@Args('filters', { nullable: true }) filters?: ListPlayerCharacterInput) {
    return this.playerCharacterService.list(filters);
  }
}
