import { Model } from 'mongoose';
import { ListPlayerCharacterInput } from './player-character.inputs';
import { CharacterStats, PlayerCharacterDocument } from './player-character.model';
export declare class PlayerCharacterService {
    private playerCharacterModel;
    constructor(playerCharacterModel: Model<PlayerCharacterDocument>);
    list(filter: ListPlayerCharacterInput): Promise<PlayerCharacterDocument[]>;
    aggregate(filter: ListPlayerCharacterInput): Promise<CharacterStats[]>;
}
