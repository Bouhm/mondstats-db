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
    const a = await abyssBattleService.getTopParties();
    console.log(a);
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();
