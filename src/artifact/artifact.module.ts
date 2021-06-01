import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Artifact, ArtifactSchema } from './artifact.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Artifact.name, schema: ArtifactSchema },
    ]),
  ],
})
export class ArtifactModule {}
