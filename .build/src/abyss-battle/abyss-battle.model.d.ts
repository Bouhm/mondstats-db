import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class PartyStats {
    party: number[];
    count: number;
}
export declare class AbyssStats {
    party_stats: PartyStats[][];
    floor_level: string;
}
export declare class AbyssBattle {
    _id: MongooseSchema.Types.ObjectId;
    floor_level: string;
    battle_index: number;
    player: MongooseSchema.Types.ObjectId;
    party: MongooseSchema.Types.ObjectId[];
}
export declare type AbyssBattleDocument = AbyssBattle & Document;
export declare const AbyssBattleSchema: mongoose.Schema<mongoose.Document<AbyssBattle, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<AbyssBattleDocument, {}, {}>;
export default _default;
