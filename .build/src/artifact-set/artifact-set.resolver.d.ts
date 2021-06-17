import { ListArtifactSetInput } from './artifact-set.inputs';
import { ArtifactSetService } from './artifact-set.service';
export declare class ArtifactSetResolver {
    private artifactSetService;
    constructor(artifactSetService: ArtifactSetService);
    artifactsSets(filter?: ListArtifactSetInput): Promise<import("src/artifact-set/artifact-set.model").ArtifactSetDocument[]>;
}
