import { Model } from 'mongoose';
import { ListCharacterInput } from './character.inputs';
import { CharacterDocument } from './character.model';
export declare class CharacterService {
    private characterModel;
    constructor(characterModel: Model<CharacterDocument>);
    list(filter: ListCharacterInput): Promise<CharacterDocument[]>;
}
