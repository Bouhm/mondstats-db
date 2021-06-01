import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Weapon, WeaponDocument } from './weapon.model';

@Injectable()
export class WeaponService {
  constructor(
    @InjectModel(Weapon.name)
    private WeaponModel: Model<WeaponDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<WeaponDocument>,
    update: UpdateQuery<WeaponDocument>,
    options: QueryOptions,
  ) {
    return this.WeaponModel.findOneAndUpdate(filter, update, options);
  }
}
