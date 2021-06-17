import { ListWeaponInput } from './weapon.inputs';
import { WeaponService } from './weapon.service';
export declare class WeaponResolver {
    private weaponService;
    constructor(weaponService: WeaponService);
    weapons(filter?: ListWeaponInput): Promise<import("src/weapon/weapon.model").WeaponDocument[]>;
}
