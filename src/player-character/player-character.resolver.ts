import { Artifact } from 'src/artifact/artifact.model';

import { Args, Parent, Query, Resolver } from '@nestjs/graphql';

import { ListPlayerCharacterInput } from './player-character.inputs';
import { PlayerCharacter, PlayerCharacterDocument } from './player-character.model';
import { PlayerCharacterService } from './player-character.service';

@Resolver()
export class PlayerCharacterResolver {
  constructor(
    private playerCharacterService: PlayerCharacterService
    
    
    ) {}

  @Query(() => [PlayerCharacter])
  async playerCharacters(@Args('filter', { nullable: true }) filter?: ListPlayerCharacterInput) {
    return this.playerCharacterService.list(filter);
  }

  @Resolver(() => [PlayerCharacter])
  async artifacts(@Parent() playerCharacter: PlayerCharacterDocument) {
    const artifacts = await playerCharacter
      .populate({ path: 'artifacts', model: Artifact.name })
      .execPopulate();

    console.log(artifacts);
    return artifacts;
  }
}
