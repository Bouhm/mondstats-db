import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class Constellation {
    effect: string;
    oid: number;
    name: string;
    pos: number;
    icon: string;
}
export declare class Character {
    _id: MongooseSchema.Types.ObjectId;
    oid: number;
    constellations: Constellation[];
    element: string;
    name: string;
    rarity: number;
    icon: string;
    image: string;
}
export declare type CharacterDocument = Character & Document;
export declare const CharacterSchema: mongoose.Schema<mongoose.Document<Character, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<CharacterDocument, {}, {}>;
export default _default;
