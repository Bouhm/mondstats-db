import { Resolver } from '@nestjs/graphql';

import { PlayerCharacterService } from './player-character.service';

@Resolver()
export class PlayerCharacterResolver {
  constructor(private playerCharacterService: PlayerCharacterService) {}
}
