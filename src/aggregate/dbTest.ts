import {
  cloneDeep,
  difference,
  filter,
  find,
  findIndex,
  flatten,
  forEach,
  intersection,
  isEqual,
  map,
  orderBy,
  range,
} from 'lodash';
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
    const characters = await characterService.list();
    const characterIds = map(characters, ({ _id }) => _id);

    // const a = await playerCharacterService.getTopBuilds({ character: characterIds[0] });
    
    // const abyssTopTeams: TeamStat[] = await abyssBattleService.getTopParties();
    // const abyssFloorTeams: { [floor: string]: TeamStat[][] } = {};

    const b = await abyssBattleService.getBuildAbyssStats(characterIds[0])
    console.log(b)

    // map(
    //   map(range(9, 13), (floor) => {
    //     map(range(1, 4), async (stage) => {
    //       abyssFloorTeams[`${floor}-${stage}`] = await abyssBattleService.getTopFloorParties(
    //         `${floor}-${stage}`,
    //       );
    //     });
    //   }),
    // );


    // const abyssTopCharTeams: { [charId: string]: TeamStat[] } = {};
    // const abyssFloorCharTeams: { [floor: string]: { [charId: string]: TeamStat[][] } } = {};

    // for (const charId of characterIds) {
    //   abyssTopCharTeams[charId] = await abyssBattleService.getTopParties({
    //     [charId],
    //   });

    //   for (const floor of range(9, 13)) {
    //     for (const stage of range(1, 4)) {
    //       if (!abyssFloorCharTeams[`${floor}-${stage}`])
    //         abyssFloorCharTeams[`${floor}-${stage}`] = { [charId]: [] };

    //       abyssFloorCharTeams[`${floor}-${stage}`][charId] = await abyssBattleService.getTopFloorParties(
    //         `${floor}-${stage}`,
    //         [charId],
    //         100,
    //       );
    //     }
    //   }
    // }

    // forEach(abyssTopCharTeams, (teams) => {
    //   forEach(teams, (team) => {
    //     const abyssTeam = find(abyssTopTeams, (_team) => isEqual(_team.party.sort(), team.party.sort()));

    //     if (!abyssTeam) {
    //       abyssTopTeams.push(team);
    //     }
    //   });
    // });

    // forEach(abyssFloorCharTeams, (chars, floor) => {
    //   forEach(chars, (half, i) => {
    //     forEach(half, (teams) => {
    //       forEach(teams, (team) => {
    //         const abyssTeam = find(abyssTopTeams, (_team) =>
    //           isEqual(_team.party.sort(), team.party.sort()),
    //         );

    //         if (!abyssTeam) {
    //           abyssFloorTeams[floor][i].push(team);
    //         }
    //       });
    //     });
    //   });
    // });

    // const abyssTopCoreTeams: any = map(abyssTopCharTeams, (parties) =>
    //   aggregateCoreTeams(orderBy(parties, 'count', 'desc')),
    // );
    // const abyssFloorCoreTeams: any = {};

    // forEach(abyssFloorTeams, (half, floor) => {
    //   forEach(half, (parties) => {
    //     abyssFloorCoreTeams[floor] = aggregateCoreTeams(orderBy(parties, 'count', 'desc'));
    //   });
    // });

    // console.log(abyssTopCoreTeams, abyssFloorCoreTeams);
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();

type Flex = { charId: string; count: number };

const aggregateCoreTeams = (parties: TeamStat[]) => {
  const allIndexes = [0, 1, 2, 3];
  const permIndexes = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];

  let coreTeams: { core_party: string[]; count: number; flex: Flex[][] }[] = [];

  forEach(parties, ({ party, count }) => {
    forEach(permIndexes, (coreIndexes) => {
      const coreParty = [party[coreIndexes[0]], party[coreIndexes[1]], party[coreIndexes[2]]].sort();
      const partyIdx = findIndex(coreTeams, (team) => {
        return (
          isEqual(team.core_party, coreParty) &&
          intersection(map(team.flex[0], (flex) => flex.charId)).length > 0
        );
      });
      const flexIdx = difference(allIndexes, coreIndexes)[0];

      if (partyIdx > -1) {
        coreTeams[partyIdx].count += count;
        const charIdx = findIndex(coreTeams[partyIdx].flex[0], (flex) => flex.charId === party[flexIdx]);

        if (charIdx > -1) {
          coreTeams[partyIdx].flex[0][charIdx].count += count;
        } else {
          coreTeams[partyIdx].flex[0].push({ charId: party[flexIdx], count });
        }
      } else {
        coreTeams.push({
          core_party: coreParty,
          count,
          flex: [[{ charId: party[flexIdx], count }]],
        });
      }
    });
  });

  coreTeams = orderBy(coreTeams, 'count', 'desc');
  coreTeams.forEach((team, i) => {
    team.flex[0] = orderBy(team.flex[0], 'count', 'desc');
  });

  const combinedTeams = [];
  while (coreTeams.length) {
    const team1 = coreTeams[0];
    const compareTeams = cloneDeep(coreTeams.slice(1));
    const coreTeams2 = [];
    const prevCoreTeamsLen = coreTeams.length;

    let i = 0;
    while (i < compareTeams.length) {
      if (
        difference(
          [...compareTeams[i].core_party, compareTeams[i].flex[0][0].charId],
          [...team1.core_party, team1.flex[0][0].charId],
        ).length === 1
      ) {
        coreTeams2.push(compareTeams[i]);
        compareTeams.splice(i, 1);
      } else {
        i++;
      }
    }

    if (team1) combinedTeams.push(team1);

    if (prevCoreTeamsLen === compareTeams.length) {
      coreTeams = coreTeams.slice(1);
    } else {
      coreTeams = compareTeams;
    }
  }

  const threshold = 0.15;
  combinedTeams.forEach((team) => {
    // const flexTotal = getTotal(team.flex);

    team.flex[0] = orderBy(
      filter(team.flex[0], (flex) => {
        return flex.count / team.count >= threshold;
      }),
      'count',
      'desc',
    );
  });

  const mergedTeams = [];
  combinedTeams.forEach((team) => {
    const teamIdx = findIndex(mergedTeams, (_team) => {
      if ((team.flex[0] && !team.flex[0].length) || (_team.flex[0] && !_team.flex[0].length)) return false;

      return isEqual(
        [...team.core_party, team.flex[0][0].charId].sort(),
        [..._team.core_party, _team.flex[0][0].charId].sort(),
      );
    });

    if (teamIdx > -1) {
      mergedTeams[teamIdx].flex.push(team.flex[0]);
      mergedTeams[teamIdx].count += team.count;
    } else {
      mergedTeams.push(team);
    }
  });

  return orderBy(mergedTeams, 'count', 'desc');
};
