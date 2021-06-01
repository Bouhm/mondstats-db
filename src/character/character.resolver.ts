import { Args, Query, Resolver } from '@nestjs/graphql';

import { Character } from './character.model';
import { CharacterService } from './character.service';

@Resolver()
export class CharacterResolver {
  constructor(private characterService: CharacterService) {}

  @Query(() => [Character])
  async Characters(@Args('ids') ids: number[]) {
    this.characterService.getByIds(ids);
  }
}
