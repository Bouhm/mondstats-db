import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class Artifact {
    _id: MongooseSchema.Types.ObjectId;
    oid: number;
    icon: string;
    name: string;
    pos: number;
    pos_name: string;
    rarity: number;
    set: MongooseSchema.Types.ObjectId;
}
export declare type ArtifactDocument = Artifact & Document;
export declare const ArtifactSchema: mongoose.Schema<mongoose.Document<Artifact, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<ArtifactDocument, {}, {}>;
export default _default;
