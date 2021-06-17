import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssStats } from './abyss-battle.model';
import { AbyssBattleService } from './abyss-battle.service';
export declare class AbyssBattleResolver {
    private abyssBattleService;
    constructor(abyssBattleService: AbyssBattleService);
    abyssBattles(filter?: ListAbyssBattleInput): Promise<import("src/abyss-battle/abyss-battle.model").AbyssBattleDocument[]>;
    abyssStats(filter?: ListAbyssBattleInput): Promise<AbyssStats[]>;
}
