import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
export declare class BuildWeapon {
    oid: number;
    count: number;
}
export declare class BuildSet {
    oid: number;
    activation_number: number;
}
export declare class BuildStats {
    buildId: number;
    weapons: BuildWeapon[];
    artifacts: BuildSet[];
    count: number;
}
export declare class CharacterStats {
    oid: number;
    builds: BuildStats[];
    constellations: number[];
    total: number;
}
export declare class PlayerCharacter {
    _id: MongooseSchema.Types.ObjectId;
    oid: number;
    character: MongooseSchema.Types.ObjectId;
    player: MongooseSchema.Types.ObjectId;
    artifacts: MongooseSchema.Types.ObjectId[];
    constellation: number;
    fetter: number;
    level: number;
    weapon: MongooseSchema.Types.ObjectId;
}
export declare type PlayerCharacterDocument = PlayerCharacter & Document;
export declare const PlayerCharacterSchema: mongoose.Schema<mongoose.Document<PlayerCharacter, any>, mongoose.Model<any, any, any>, undefined>;
declare const _default: mongoose.Model<PlayerCharacterDocument, {}, {}>;
export default _default;
