import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListWeaponInput } from './weapon.inputs';
import { Weapon, WeaponDocument } from './weapon.model';

@Injectable()
export class WeaponService {
  constructor(
    @InjectModel(Weapon.name)
    private weaponModel: Model<WeaponDocument>,
  ) {}

  list(filters: ListWeaponInput) {
    return this.weaponModel.find({ ...filters }).exec();
  }
}
