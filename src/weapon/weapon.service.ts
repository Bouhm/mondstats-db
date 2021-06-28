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

  list(filter: ListWeaponInput) {
    const queryFilter = {};

    if (filter) {
      const { oids } = filter;
      if (oids && oids.length > 0) {
        queryFilter['oid'] = { $in: oids };
      }
    }

    return this.weaponModel.find(queryFilter).lean().exec();
  }
}
