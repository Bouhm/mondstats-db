import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class Affix {
    activation_number: number;
    effect: string;
}
export declare class ArtifactSet {
    _id: MongooseSchema.Types.ObjectId;
    oid: number;
    affixes: Affix[];
    name: string;
}
export declare type ArtifactSetDocument = ArtifactSet & Document;
export declare const ArtifactSetSchema: mongoose.Schema<mongoose.Document<ArtifactSet, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<ArtifactSetDocument, {}, {}>;
export default _default;
