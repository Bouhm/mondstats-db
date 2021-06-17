import { Model } from 'mongoose';
import { ListWeaponInput } from './weapon.inputs';
import { WeaponDocument } from './weapon.model';
export declare class WeaponService {
    private weaponModel;
    constructor(weaponModel: Model<WeaponDocument>);
    list(filter: ListWeaponInput): Promise<WeaponDocument[]>;
}
