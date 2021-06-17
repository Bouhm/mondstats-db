import { Model } from 'mongoose';
import { ListPlayerInput } from './player.inputs';
import { PlayerDocument } from './player.model';
export declare class PlayerService {
    private playerModel;
    constructor(playerModel: Model<PlayerDocument>);
    list(filter: ListPlayerInput): Promise<PlayerDocument[]>;
}
