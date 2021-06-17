import { ListPlayerInput } from './player.inputs';
import { PlayerService } from './player.service';
export declare class PlayerResolver {
    private playerService;
    constructor(playerService: PlayerService);
    players(filter?: ListPlayerInput): Promise<import("src/player/player.model").PlayerDocument[]>;
}
