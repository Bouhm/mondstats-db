import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListPlayerCharacterInput } from './player-character.inputs';
import { PlayerCharacter, PlayerCharacterDocument } from './player-character.model';

@Injectable()
export class PlayerCharacterService {
  constructor(
    @InjectModel(PlayerCharacter.name)
    private playerCharacterModel: Model<PlayerCharacterDocument>,
  ) {}

  list(filter: ListPlayerCharacterInput) {
    const queryFilter = {};

    if (queryFilter) {
      const { charIds, uids } = filter;
      if (charIds && charIds.length > 0) {
        queryFilter['oid'] = { $in: charIds };
      }

      if (uids && uids.length > 0) {
        queryFilter['uid'] = { $in: uids };
      }
    }

    return this.playerCharacterModel.find(queryFilter).exec();
  }
}
