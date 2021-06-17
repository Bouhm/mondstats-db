import { ListCharacterInput } from './character.inputs';
import { CharacterService } from './character.service';
export declare class CharacterResolver {
    private characterService;
    constructor(characterService: CharacterService);
    characters(filter?: ListCharacterInput): Promise<import("src/character/character.model").CharacterDocument[]>;
}
