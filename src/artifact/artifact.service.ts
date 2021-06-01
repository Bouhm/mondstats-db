import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Artifact, ArtifactDocument } from './artifact.model';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectModel(Artifact.name)
    private ArtifactModel: Model<ArtifactDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<ArtifactDocument>,
    update: UpdateQuery<ArtifactDocument>,
    options: QueryOptions,
  ) {
    return this.ArtifactModel.findOneAndUpdate(filter, update, options);
  }
}
