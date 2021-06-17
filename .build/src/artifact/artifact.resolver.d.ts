import { ListArtifactInput } from './artifact.inputs';
import { ArtifactService } from './artifact.service';
export declare class ArtifactResolver {
    private artifactService;
    constructor(artifactService: ArtifactService);
    artifacts(filter?: ListArtifactInput): Promise<import("src/artifact/artifact.model").ArtifactDocument[]>;
}
