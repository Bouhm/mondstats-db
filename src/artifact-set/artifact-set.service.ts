import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ArtifactSet, ArtifactSetDocument } from './artifact-set.model';

@Injectable()
export class ArtifactSetService {
  constructor(
    @InjectModel(ArtifactSet.name)
    private artifactSetModel: Model<ArtifactSetDocument>,
  ) {}

  getByIds(ids: number[]) {
    return this.artifactSetModel.find({ id: { $in: ids } }).exec();
  }
}
