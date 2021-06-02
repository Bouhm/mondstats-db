import { Args, Query, Resolver } from '@nestjs/graphql';

import { Weapon } from './weapon.model';
import { WeaponService } from './weapon.service';

@Resolver()
export class WeaponResolver {
  constructor(private weaponService: WeaponService) {}

  @Query(() => [Weapon])
  async Weapons(@Args('ids') ids: number[]) {
    return this.weaponService.getByIds(ids);
  }
}
