import genshindb from 'genshin-db';
import { filter, forEach, map, maxBy } from 'lodash';
import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Artifact, ArtifactDocument } from '../artifact/artifact.model';
import { ListArtifactSetInput } from './artifact-set.inputs';
import { ArtifactSet, ArtifactSetDocument } from './artifact-set.model';

@Injectable()
export class ArtifactSetService {
  constructor(
    @InjectModel(ArtifactSet.name)
    private artifactSetModel: Model<ArtifactSetDocument>,

    @InjectModel(Artifact.name)
    private artifactModel: Model<ArtifactDocument>,
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

  async aggregate() {
    const artifactSets = await this.artifactSetModel.find().lean().exec();
    const filteredSets = [];
    artifactSets.forEach((set: any) => {
      set.rarity = parseInt(genshindb.artifacts(set.name).rarity.pop());
      if (set.rarity > 3) {
        delete set.__v;
        delete set.createdAt;
        delete set.updatedAt;

        forEach(set, (o) => forEach(o.affixes, (affix, i) => delete o.affixes[i]._id));
        filteredSets.push(set);
      }
    });

    return filteredSets;
  }
}
