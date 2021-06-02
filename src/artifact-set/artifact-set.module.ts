import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ArtifactSet, ArtifactSetSchema } from './artifact-set.model';
import { ArtifactSetResolver } from './artifact-set.resolver';
import { ArtifactSetService } from './artifact-set.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ArtifactSet.name, schema: ArtifactSetSchema }])],
  providers: [ArtifactSetService, ArtifactSetResolver],
})
export class ArtifactSetModule {}
