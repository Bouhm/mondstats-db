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
  uniq,
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

type TeamStat = { party: string[]; floorLevel?: string; battleIndex?: number; count: number };
(async () => {
  await connectDb();

  try {
    const characters = await characterService.list();
    const characterIds = map(characters, ({ _id }) => _id);
    const allFloors = [];

    forEach(range(9, 13), (floor) => {
      forEach(range(1, 4), (stage) => {
        forEach(range(1, 3), (battle) => {
          // forEach(characterIds, (charId) => {
          allFloors.push({
            floorLevel: `${floor}-${stage}`,
            battleIndex: battle,
            // characterIds: [charId],
          });
          // });
        });
      });
    });

    const allFloorTeams = uniq(
      await Promise.all(
        flatten(
          map(allFloors, (floor) => {
            const { floorLevel, battleIndex } = floor;

            return [
              abyssBattleService.getTopFloorParties(floorLevel, battleIndex, [], 20),
              ...map(characterIds, (charId) =>
                abyssBattleService.getTopFloorParties(floorLevel, battleIndex, [charId]),
              ),
            ];
          }),
        ),
      ),
    );

    console.log('Done top floor teams');

    let allTopTeams: TeamStat[] = await abyssBattleService.getTopParties();
    const topCharTeams: TeamStat[][] = await Promise.all(
      map(characterIds, (charId) => abyssBattleService.getTopParties([charId])),
    );

    const topCharFloorTeams: { [floor: string]: TeamStat[] } = {};

    console.log('Done character floor teams');

    // Merge character top teams into top teams
    forEach(topCharTeams, (teams) => {
      forEach(teams, (team) => {
        const party = map(team, (charId) => charId.toString()).sort();
        const teamIdx = findIndex(allTopTeams, (_team) => isEqual(_team.party, party));

        if (teamIdx < 0) {
          allTopTeams.push(team);
        }
      });
    });

    // forEach(charFloorTeams, (team) => {
    //   const party = map(team, (charId) => charId.toString()).sort();

    //   const teamIdx = findIndex(allFloorTeams[team.floorLevel], (_team) => {
    //     return (
    //       isEqual(_team.party.sort(), team.party.sort()) &&
    //       _team.floorLevel === team.floorLevel &&
    //       _team.battleIndex === team.battleIndex
    //     );
    //   });

    //   if (teamIdx < 0) {
    //     if (!allFloorTeams[team.floorLevel]) {
    //       allFloorTeams[team.floorLevel] = [abyssTeam];
    //     } else {
    //       allFloorTeams[team.floorLevel].push(abyssTeam);
    //     }
    //   }
    // });

    allTopTeams = aggregateCoreTeams(allTopTeams);

    forEach(allFloorTeams, (parties, floor) => {
      allFloorTeams[floor] = aggregateCoreTeams(orderBy(parties, 'count', 'desc'));
    });

    console.log('Done merging teams');

    const topWeaponStats = await abyssBattleService.getWeaponAbyssStats();
    const weaponStatTotals = await abyssBattleService.getWeaponTypeTotals();
    const topArtifactSetStats = await abyssBattleService.getArtifactSetsAbyssStats();
    const artifactSetTotals = await abyssBattleService.getArtifactSetTotals();

    console.log();
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();

type Flex = { charId: string; count: number };

const aggregateCoreTeams = (parties: TeamStat[]) => {
  const partyIndexes = [0, 1, 2, 3];
  const allIndexes = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];

  let coreTeams: { coreParty: string[]; count: number; flex: Flex[][] }[] = [];

  forEach(parties, ({ party, count }) => {
    forEach(allIndexes, (coreIndexes) => {
      const coreParty = [party[coreIndexes[0]], party[coreIndexes[1]], party[coreIndexes[2]]].sort();
      const partyIdx = findIndex(coreTeams, (team) => {
        return (
          isEqual(team.coreParty, coreParty) &&
          intersection(map(team.flex[0], (flex) => flex.charId)).length > 0
        );
      });
      const flexIdx = difference(partyIndexes, coreIndexes)[0];

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
          coreParty: coreParty,
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
          [...compareTeams[i].coreParty, compareTeams[i].flex[0][0].charId],
          [...team1.coreParty, team1.flex[0][0].charId],
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
        [...team.coreParty, team.flex[0][0].charId].sort(),
        [..._team.coreParty, _team.flex[0][0].charId].sort(),
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
