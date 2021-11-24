import fs from 'fs';
import {
  chunk,
  cloneDeep,
  difference,
  filter,
  find,
  findIndex,
  flatten,
  flattenDeep,
  forEach,
  groupBy,
  intersection,
  isEqual,
  map,
  omit,
  orderBy,
  range,
  reduce,
  take,
  uniqWith,
} from 'lodash';
import mongoose from 'mongoose';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import playerModel from '../player/player.model';
import { getShortName, unwindBy } from '../util';
import connectDb from '../util/connection';
import { getDb } from './writeDb';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);
const characterService = new CharacterService(characterModel);

(async () => {
  await connectDb();
  try {
    const { characterDb } = await getDb();
    const characters = await characterService.list();
    const characterIds = map(characters, ({ _id }) => _id);

    // const allFloors = [];

    // forEach(range(9, 13), (floor) => {
    //   forEach(range(1, 4), (stage) => {
    //     forEach(range(1, 3), (battle) => {
    //       allFloors.push({
    //         floor_level: `${floor}-${stage}`,
    //         battle_index: battle,
    //       });
    //     });
    //   });
    // });

    const allCharFloors = [];

    forEach(range(9, 13), (floor) => {
      forEach(range(1, 4), (stage) => {
        forEach(range(1, 3), (battle) => {
          forEach(characterIds, (charId) => {
            allCharFloors.push({
              floor_level: `${floor}-${stage}`,
              battle_index: battle,
              characterId: charId,
            });
          });
        });
      });
    });

    const allTopTeams = flatten(
      await Promise.all(
        flattenDeep(map(characterIds, (characterId) => abyssBattleService.getTopParties(characterId))),
      ),
    );

    const topTeams = aggregateCoreTeams(uniqWith(allTopTeams, compareParties));

    const allFloorTeams = flatten(
      await Promise.all(
        flattenDeep(
          map(allCharFloors.pop(), ({ floor_level, battle_index, characterId }) =>
            abyssBattleService.getTopFloorParties(floor_level, battle_index, characterId),
          ),
        ),
      ),
    );

    const floorTeams = aggregateCoreTeams(uniqWith(allFloorTeams, compareParties));

    console.log('Done top teams');

    // const groupedFloorTeams = {};

    // forEach(groupBy(allFloorTeams, 'battle'), (battleData: TeamStat[], floorLevel: string) => {
    //   groupedFloorTeams[floorLevel] = aggregateCoreTeams(
    //     orderBy(battleData, ['count', 'winCount'], ['desc', 'desc']),
    //   );
    // });

    console.log('Done floor teams');

    const allWeaponAbyssStats = groupBy(await abyssBattleService.getWeaponAbyssStats(), 'weaponType');

    console.log('Done weapon abyss stats');

    const charBuilds = flatten(
      await Promise.all(
        flattenDeep(map(characterIds, (charId) => playerCharacterService.getCharacterBuilds(charId))),
      ),
    );

    console.log('Done character builds');

    // const splitFloors = chunk(allCharFloors, Math.round(allCharFloors.length / 20));
    // let characterBuildAbyssStats = [];

    // while (splitFloors.length) {
    //   characterBuildAbyssStats = [
    //     ...characterBuildAbyssStats,
    //     ...flatten(
    //       await Promise.all(
    //         flattenDeep(
    //           map(splitFloors.pop(), ({ floor_level, battle_index }) =>
    //             abyssBattleService.getCharacterBuildAbyssStats(floor_level, battle_index),
    //           ),
    //         ),
    //       ),
    //     ),
    //   ];
    // }

    // const charBuildAbyssStats = await abyssBattleService.getCharacterBuildAbyssStats('9-1', 1);
    // console.log('Done character build abyss stats');

    // let artifactSetAbyssStats = [];

    // for (const floor of allFloors) {
    //   console.log(floor.floor_level, floor.battle_index);
    //   artifactSetAbyssStats.push(
    //     await abyssBattleService.getArtifactSetAbyssStats(floor.floor_level, floor.battle_index),
    //   );
    // }

    const artifactSetAbyssStats = await abyssBattleService.getArtifactSetAbyssStats('9-1', 1);

    // artifactSetAbyssStats = reduce(
    //   artifactSetAbyssStats,
    //   (combined, curr) => {
    //     const setIdx = findIndex(combined, ({ _id }) => isEqual(_id, curr._id));

    //     if (setIdx > -1) {
    //       const { count, winCount, avgStar } = curr;
    //       const currCombined = combined[setIdx];

    //       currCombined.count += count;
    //       currCombined.winCount += winCount;
    //       currCombined.avgStar =
    //         (currCombined.avgStar * currCombined.count + avgStar * count) / (currCombined.count + count);
    //     } else {
    //       combined.push(curr);
    //     }

    //     return combined;
    //   },
    //   [],
    // );

    console.log('Done artifactset abyss stats');

    // const characterAbyssStats = [];

    // for (const floor of allFloors) {
    //   console.log(floor.floor_level, floor.battle_index);

    //   characterAbyssStats.push(
    //     await abyssBattleService.getCharacterAbyssStats(floor.floor_level, floor.battle_index),
    //   );
    // }

    const characterAbyssStats = await abyssBattleService.getCharacterAbyssStats('9-1', 1);

    console.log('Done character abyss stats');

    const weaponTotals = {};
    for (const character of characterIds) {
      const weaponStats: { _id: string; total: number }[] =
        await playerCharacterService.getWeaponTypeTotals(character);
      forEach(weaponStats, ({ _id, total }) => {
        if (weaponTotals[_id]) {
          weaponTotals[_id] += total;
        } else {
          weaponTotals[_id] = total;
        }
      });
    }

    console.log('Done weapon totals');

    const artifactSetTotals = await playerCharacterService.getArtifactSetTotals();
    console.log('Done artifactset totals');

    const characterTotals = await playerCharacterService.getCharacterTotals();
    console.log('Done character totals');

    const topWeaponStats = {
      weapons: weaponAbyssStats,
      totals: weaponTotals,
    };

    const topArtifactSetStats = {
      artifactSets: artifactSetAbyssStats,
      totals: artifactSetTotals,
    };

    const topCharacterStats = {
      characters: characterAbyssStats,
      totals: characterTotals,
    };

    charBuilds.forEach((charBuild) => {
      const buildIdx = findIndex(charBuildAbyssStats, ({ _id, weapon, artifactSets }) => {
        return (
          _id.toString() === charBuild._id.toString() &&
          isEqual(charBuild.artifactSets, artifactSets) &&
          weapon.toString() === charBuild.weapon.toString()
        );
      });

      if (buildIdx > -1) {
        charBuild.avgStar = charBuildAbyssStats[buildIdx].avgStar;
        charBuild.count = charBuildAbyssStats[buildIdx].count;
        charBuild.winCount = charBuildAbyssStats[buildIdx].winCount;
      }
    });

    console.log(weaponAbyssStats); // { count, avgStar, winCount, _id: [_id], type: ['Sword'] }[]
    console.log(take(artifactSetAbyssStats, 5)); // { _id: { _id, activation_number }[], avgStar, count, winCount }[]
    console.log(weaponTotals); // { _id, total } _id is empty array
    console.log(take(artifactSetTotals, 5)); // [{ _id: [], total }]
    console.log(take(charBuildAbyssStats, 5)); // [] Empty array
    console.log(take(characterAbyssStats, 5));
    console.log(take(characterTotals, 5)); // { _id, total }[]
    console.log(take(charBuilds, 5)); // { artifactSets: _id[], _id, weapons: { _id, count }[] }[]
    console.log(take(floorTeams, 5)); // [] Empty array
    console.log(take(topTeams, 5)); //

    await Promise.all([
      fs.writeFile('data/weapons/stats/top-weapons.json', JSON.stringify(topWeaponStats), (e) => e),
      fs.writeFile(
        'data/artifacts/stats/top-artifactsets.json',
        JSON.stringify(topArtifactSetStats),
        (e) => e,
      ),
      fs.writeFile(
        'data/characters/stats/top-characters.json',
        JSON.stringify(topCharacterStats),
        (e) => e,
      ),
      // fs.writeFile(
      //   'data/characters/stats/character-totals.json',
      //   JSON.stringify(characterStatsTotals),
      //   (e) => e,
      // ),
      ...map(charBuilds, (charBuild) => {
        const character = find(characterDb, { _id: charBuild.char_id });
        const fileName = getShortName(character);
        return fs.writeFile(`data/characters/${fileName}.json`, JSON.stringify(charBuild), (e) => e);
      }),
      // ...map(mainCharacterBuilds, (charBuild) => {
      //   const character = find(characterDb, { _id: charBuild.char_id });
      //   const fileName = getShortName(character);
      //   return fs.writeFile(`data/characters/mains/${fileName}.json`, JSON.stringify(charBuild), (e) => e);
      // }),
      fs.writeFile('data/abyss/stats/top-abyss-teams.json', JSON.stringify(topTeams), (e) => e),
      ...map(Object.entries(allFloorTeams), (teamData) => {
        return fs.writeFile(`data/abyss/${teamData[0]}.json`, JSON.stringify(teamData[1]), (e) => e);
      }),
    ]);
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();

type TeamStat = {
  party: string[];
  battle?: string;
  count: number;
  winCount: number;
  avgStar: number;
};

type Flex = { charId: string; count: number };

const compareParties = (src, other) => {
  let compareFloors = true;
  if (src.floorLevel && src.battleIndex) {
    compareFloors = src.floorLevel === other.floorLevel && src.battleIndex === other.battleIndex;
  }

  return isEqual(src.party, other.party) && compareFloors;
};

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
