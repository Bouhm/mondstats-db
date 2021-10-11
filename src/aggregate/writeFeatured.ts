import fs from 'fs';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import playerModel from '../player/player.model';
import { PlayerService } from '../player/player.service';

export const aggregateFeatured = async () => {
  const playerCharacterService = new PlayerCharacterService(playerCharacterModel);
  const abyssBattleService = new AbyssBattleService(abyssBattleModel);
  const playerService = new PlayerService(playerModel);

  const playerCount = await playerService.getStats();
  const playerCharacterCount = await playerCharacterService.getStats();
  const abyssBattleCount = await abyssBattleService.getStats();

  const bannerChars = ['Sangonomiya Kokomi', 'Xingqiu', 'Beidou', 'Rosaria'];

  fs.writeFile(
    'data/featured.json',
    JSON.stringify({
      player_total: playerCount,
      character_total: playerCharacterCount,
      abyss_total: abyssBattleCount,
      banner: bannerChars,
    }),
    (e) => e,
  );
}
