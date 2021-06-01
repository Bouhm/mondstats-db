import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ArtifactSet, ArtifactSetDocument } from './artifact-set.model';

@Injectable()
export class ArtifactSetService {
  constructor(
    @InjectModel(ArtifactSet.name)
    private ArtifactSetModel: Model<ArtifactSetDocument>,
  ) {}

  findOneAndUpdate(
    filter: FilterQuery<ArtifactSetDocument>,
    update: UpdateQuery<ArtifactSetDocument>,
    options: QueryOptions,
  ) {
    return this.ArtifactSetModel.findOneAndUpdate(filter, update, options);
  }
}
