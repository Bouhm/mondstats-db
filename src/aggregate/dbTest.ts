import { flatten, forEach, map, range } from 'lodash';
import mongoose, { ObjectId } from 'mongoose';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import connectDb from '../util/connection';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);
const characterService = new CharacterService(characterModel);

(async () => {
  await connectDb();

  try {
    // const abyssTopTeams = await abyssBattleService.getTopParties();
    const abyssFloorTeams: any = {};

    map(
      map(range(9, 13), (floor) => {
        map(range(1, 4), async (stage) => {
          abyssFloorTeams[`${floor}-${stage}`] = await abyssBattleService.getTopFloorParties(
            `${floor}-${stage}`,
          );
        });
      }),
    );

    const characterIds = map(await characterService.list(), ({ _id }) => _id.toString());
    const abyssTopCharTeams: any = {};
    const abyssFloorCharTeams: any = {};

    for (const charId in characterIds) {
      abyssTopCharTeams[charId] = await abyssBattleService.getTopParties({
        party: { $all: [charId] },
      });
      console.log(abyssTopCharTeams[charId]);
      for (const floor in range(9, 13)) {
        for (const stage in range(1, 4)) {
          if (!abyssFloorCharTeams[`${floor}-${stage}`])
            abyssFloorCharTeams[`${floor}-${stage}`] = { [charId]: [] };

          abyssFloorCharTeams[`${floor}-${stage}`][charId] = await abyssBattleService.getTopFloorParties(
            `${floor}-${stage}`,
            { party: { $all: [charId] } },
            100,
          );
        }
      }
    }

    console.log(abyssFloorTeams, abyssTopCharTeams, abyssFloorCharTeams);
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();
