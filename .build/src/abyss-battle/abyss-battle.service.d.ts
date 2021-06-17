import { Model } from 'mongoose';
import { CharacterDocument } from 'src/character/character.model';
import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattleDocument, AbyssStats } from './abyss-battle.model';
export declare class AbyssBattleService {
    private abyssBattleModel;
    private characterModel;
    constructor(abyssBattleModel: Model<AbyssBattleDocument>, characterModel: Model<CharacterDocument>);
    list(filter: ListAbyssBattleInput): Promise<AbyssBattleDocument[]>;
    aggregate(filter: ListAbyssBattleInput): Promise<AbyssStats[]>;
}
