import { Args, Query, Resolver } from '@nestjs/graphql';

import { ListWeaponInput } from './weapon.inputs';
import { Weapon } from './weapon.model';
import { WeaponService } from './weapon.service';

@Resolver()
export class WeaponResolver {
  constructor(private weaponService: WeaponService) {}

  @Query(() => [Weapon])
  async list(@Args('filter') filter: ListWeaponInput) {
    return this.weaponService.list(filter);
  }
}
