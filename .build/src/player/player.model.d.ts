import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class Player {
    _id: MongooseSchema.Types.ObjectId;
    uid: number;
    total_star: number;
}
export declare type PlayerDocument = Player & Document;
export declare const PlayerSchema: mongoose.Schema<mongoose.Document<Player, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<PlayerDocument, {}, {}>;
export default _default;
