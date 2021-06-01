import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Weapon, WeaponSchema } from './weapon.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Weapon.name, schema: WeaponSchema },
    ]),
  ],
})
export class WeaponModule {}
