import { Model } from 'mongoose';
import { ListArtifactSetInput } from './artifact-set.inputs';
import { ArtifactSetDocument } from './artifact-set.model';
export declare class ArtifactSetService {
    private artifactSetModel;
    constructor(artifactSetModel: Model<ArtifactSetDocument>);
    list(filter: ListArtifactSetInput): Promise<ArtifactSetDocument[]>;
}
