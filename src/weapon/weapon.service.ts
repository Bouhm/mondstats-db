import genshindb from 'genshin-db';
import _, { replace } from 'lodash';
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

  list(filter: ListWeaponInput = {}) {
    const queryFilter = {};

    if (filter) {
      const { oids } = filter;
      if (oids && oids.length > 0) {
        queryFilter['oid'] = { $in: oids };
      }
    }

    return this.weaponModel.find(queryFilter).lean().exec();
  }

  async aggregate() {
    const weapons = await this.weaponModel.find().lean().exec();

    _.forEach(weapons, (weapon: any) => {
      const { r1, r2, r3, r4, r5, baseatk, substat, subvalue, effectname, effect } = genshindb.weapons(
        weapon.name,
      );

      console.log(genshindb.weapons(weapon.name))

      weapon.baseAtk = baseatk;
      weapon.subStat = substat;
      weapon.subValue = subvalue + substat === 'Elemental Mastery' ? '' : '%';
      weapon.effectName = effectname;
      let modEffect = effect;
      for (let i = 0; i < r1.length; i++) {
        modEffect = modEffect.replace(`{${i}}`, `${r1[i]}/${r2[i]}/${r3[i]}/${r4[i]}/${r5[i]}`);
      }
      weapon.effect = modEffect;

      delete weapon.__v;
      delete weapon.createdAt;
      delete weapon.updatedAt;
    });

    return weapons;
  }
}
