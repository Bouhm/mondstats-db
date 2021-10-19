import { flatten, forEach, map, range } from 'lodash';
import mongoose from 'mongoose';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import connectDb from '../util/connection';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);

(async () => {
  await connectDb();

  try {
    // const topAbyss = await abyssBattleService.getTopParties();
    const abyssData = await Promise.all(
      flatten(
        map(range(9, 13), (floor) => {
          return map(range(1, 4), (stage) => {
            return abyssBattleService.getTopFloorParties(`${floor}-${stage}`);
          });
        }),
      ),
    );
    console.log(abyssData)
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();
