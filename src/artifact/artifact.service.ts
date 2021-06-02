import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Artifact, ArtifactDocument } from './artifact.model';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectModel(Artifact.name)
    private artifactModel: Model<ArtifactDocument>,
  ) {}

  getByIds(oids: number[]) {
    return this.artifactModel.find({ oid: { $in: oids } }).exec();
  }
}
