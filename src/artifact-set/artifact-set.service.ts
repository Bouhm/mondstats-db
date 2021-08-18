import { forEach, map, maxBy } from 'lodash';
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
    let artifactSets = await this.artifactSetModel.find().lean().exec();
    artifactSets = await Promise.all(
      map(artifactSets, async (set: any) => {
        const artifacts = await this.artifactModel.find({ set: set._id.toString(), pos: 5 }).lean().exec();
        const max = maxBy(artifacts, 'rarity') as unknown as any;
        set.rarity = max.rarity;
        delete set.__v;
        delete set.createdAt;
        delete set.updatedAt;

        forEach(set, (o) => forEach(o.affixes, (affix, i) => delete o.affixes[i]._id));
        return set;
      }),
    );

    return artifactSets;
  }
}
