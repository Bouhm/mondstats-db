import { Args, Query, Resolver } from '@nestjs/graphql';

import { ListCharacterInput } from './character.inputs';
import { Character } from './character.model';
import { CharacterService } from './character.service';

@Resolver()
export class CharacterResolver {
  constructor(private characterService: CharacterService) {}

  @Query(() => [Character])
  async characters(@Args('filters', { nullable: true }) filters?:  ListCharacterInput) {
    return this.characterService.list(filters);
  }
}
