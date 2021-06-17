import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class Weapon {
    _id: MongooseSchema.Types.ObjectId;
    oid: number;
    desc: string;
    icon: string;
    name: string;
    rarity: number;
    type: number;
    type_name: string;
}
export declare type WeaponDocument = Weapon & Document;
export declare const WeaponSchema: mongoose.Schema<mongoose.Document<Weapon, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<WeaponDocument, {}, {}>;
export default _default;
