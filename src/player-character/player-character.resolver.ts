import { Args, Resolver } from '@nestjs/graphql';

import { ListPlayerCharacterInput } from './player-character.inputs';
import { PlayerCharacterService } from './player-character.service';

@Resolver()
export class PlayerCharacterResolver {
  constructor(private playerCharacterService: PlayerCharacterService) {}

  async list(@Args('filter') filter: ListPlayerCharacterInput) {
    return this.playerCharacterService.list(filter);
  }
}
