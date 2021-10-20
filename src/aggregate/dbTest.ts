import { find, flatten, forEach, isEqual, map, range } from 'lodash';
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

type TeamStat = { party: string[]; count: number };
(async () => {
  await connectDb();

  try {
    const abyssTopTeams: TeamStat[] = await abyssBattleService.getTopParties();
    const abyssFloorTeams: { [floor: string]: TeamStat[][] } = {};

    map(
      map(range(9, 13), (floor) => {
        map(range(1, 4), async (stage) => {
          abyssFloorTeams[`${floor}-${stage}`] = await abyssBattleService.getTopFloorParties(
            `${floor}-${stage}`,
          );
        });
      }),
    );

    const characters = await await characterService.list();
    const characterIds = map(characters, ({ _id }) => _id);

    const abyssTopCharTeams: { [charId: string]: TeamStat[] } = {};
    const abyssFloorCharTeams: { [floor: string]: { [charId: string]: TeamStat[][] } } = {};

    for (const charId of [characterIds[0]]) {
      abyssTopCharTeams[charId] = await abyssBattleService.getTopParties({
        party: { $all: [charId] },
      });

      for (const floor of range(9, 13)) {
        for (const stage of range(1, 4)) {
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

    forEach(abyssTopCharTeams, (teams) => {
      forEach(teams, (team) => {
        const abyssTeam = find(abyssTopTeams, (_team) => isEqual(_team.party.sort(), team.party.sort()));

        if (!abyssTeam) {
          abyssTopTeams.push(team);
        }
      });
    });

    forEach(abyssFloorCharTeams, (chars, floor) => {
      forEach(chars, (half, i) => {
        forEach(half, (teams) => {
          forEach(teams, (team) => {
            const abyssTeam = find(abyssTopTeams, (_team) =>
              isEqual(_team.party.sort(), team.party.sort()),
            );

            if (!abyssTeam) {
              abyssFloorTeams[floor][i].push(team);
            }
          });
        });
      });
    });

    console.log(abyssTopTeams, abyssFloorTeams);
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();
