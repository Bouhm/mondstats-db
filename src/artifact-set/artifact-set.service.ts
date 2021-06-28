import fs from 'fs';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListArtifactSetInput } from './artifact-set.inputs';
import { ArtifactSet, ArtifactSetDocument } from './artifact-set.model';

@Injectable()
export class ArtifactSetService {
  constructor(
    @InjectModel(ArtifactSet.name)
    private artifactSetModel: Model<ArtifactSetDocument>,
  ) {}

  list(filter: ListArtifactSetInput) {
    const queryFilter = {};

    if (filter) {
      const { ids } = filter;
      if (ids && ids.length > 0) {
        queryFilter['id'] = { $in: ids };
      }
    }

    return this.artifactSetModel.find(queryFilter).lean().exec();
  }

  async save() {
    const artifactSets = await this.artifactSetModel.find().lean().exec();
    fs.writeFileSync('src/data/artifactSets.json', JSON.stringify(artifactSets));
  }
}
