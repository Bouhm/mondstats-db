import _ from 'lodash';
import { Model } from 'mongoose';
import { PlayerCharacterDocument } from 'src/player-character/player-character.model';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListAbyssBattleInput } from './abyss-battle.inputs';
import { AbyssBattle, AbyssBattleDocument } from './abyss-battle.model';

@Injectable()
export class AbyssBattleService {
  constructor(
    @InjectModel(AbyssBattle.name)
    private abyssBattleModel: Model<AbyssBattleDocument>,
  ) {}

  list(filter: ListAbyssBattleInput) {
    const queryFilter = {};
    if (filter) {
      const { floorLevels, charIds } = filter;
      if (floorLevels && floorLevels.length > 0) {
        queryFilter['floor_level'] = { $in: floorLevels };
      }

      if (charIds && charIds.length > 0) {
        queryFilter['oid'] = { $in: charIds };
      }
    }

    return this.abyssBattleModel.find(queryFilter).populate('party', 'oid').exec();
  }

  async aggregate(filter: ListAbyssBattleInput) {
    const battleIndices = 2;
    const abyssData = [];
    const battles = await this.list(filter);

    _.forEach(battles, ({ floor_level, battle_index, party }) => {
      const floorIdx = _.findIndex(abyssData, { floor_level });

      if (floorIdx > -1) {
        const oids = _.map(
          party,
          (char: PlayerCharacterDocument) => char.oid,
        ).sort() as unknown as number[];
        const partyIdx = _.findIndex(
          abyssData[floorIdx]['party_stats'][battle_index - 1],
          (battle: { party: number[]; count: number }) => battle.party == oids,
        );

        if (partyIdx > -1) {
          abyssData[floorIdx]['party_stats'][battle_index - 1][partyIdx].count++;
        } else {
          abyssData[floorIdx]['party_stats'][battle_index - 1] = [
            {
              party: oids,
              count: 1,
            },
          ];
        }
      } else {
        abyssData.push({
          party_stats: new Array(battleIndices),
          floor_level,
        });
      }
    });

    _.forEach(abyssData, ({ party_stats }) => {
      _.forEach(party_stats, (battle) => {
        battle = _.pick(_.sortBy(battle, 'count'), 20);
      });
    });

    return abyssData;
  }
}
