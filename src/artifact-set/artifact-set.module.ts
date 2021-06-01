import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ArtifactSet, ArtifactSetSchema } from './artifact-set.model';

@Module({
  imports: [MongooseModule.forFeature([{ name: ArtifactSet.name, schema: ArtifactSetSchema }])],
})
export class ArtifactSetModule {}
