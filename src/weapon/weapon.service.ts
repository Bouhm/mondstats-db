import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Weapon, WeaponDocument } from './weapon.model';

@Injectable()
export class WeaponService {
  constructor(
    @InjectModel(Weapon.name)
    private weaponModel: Model<WeaponDocument>,
  ) {}

  getByIds(ids: number[]) {
    return this.weaponModel.find({ id: { $in: ids } });
  }
}
