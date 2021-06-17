import { ListPlayerCharacterInput } from './player-character.inputs';
import { CharacterStats } from './player-character.model';
import { PlayerCharacterService } from './player-character.service';
export declare class PlayerCharacterResolver {
    private playerCharacterService;
    constructor(playerCharacterService: PlayerCharacterService);
    playerCharacters(filter?: ListPlayerCharacterInput): Promise<import("src/player-character/player-character.model").PlayerCharacterDocument[]>;
    characterStats(filter?: ListPlayerCharacterInput): Promise<CharacterStats[]>;
}
