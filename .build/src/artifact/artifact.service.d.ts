import { Model } from 'mongoose';
import { ListArtifactInput } from './artifact.inputs';
import { ArtifactDocument } from './artifact.model';
export declare class ArtifactService {
    private artifactModel;
    constructor(artifactModel: Model<ArtifactDocument>);
    list(filter: ListArtifactInput): Promise<ArtifactDocument[]>;
}
