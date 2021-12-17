import fs from 'fs';
import {
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
  some,
  uniqWith,
  values,
} from 'lodash';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import characterModel from '../character/character.model';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import { getDb } from './writeDb';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);

type TeamStat = {
  party: string[];
  floorLevel?: string;
  battleIndex?: number;
  battleCount: number;
  winCount: number;
  avgStar: number;
};

type Flex = {
  charId: string;
  battleCount: number;
  winCount: number;
  avgStar: number;
};

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

  let coreTeams: {
    coreParty: string[];
    battleCount: number;
    winCount: number;
    avgStar: number;
    flex: Flex[][];
  }[] = [];

  forEach(parties, ({ party, battleCount, winCount, avgStar }) => {
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
        coreTeams[partyIdx].battleCount += battleCount;
        coreTeams[partyIdx].winCount += winCount;
        coreTeams[partyIdx].avgStar =
          (coreTeams[partyIdx].avgStar * coreTeams[partyIdx].battleCount + avgStar * battleCount) /
          (coreTeams[partyIdx].battleCount + battleCount);
        const charIdx = findIndex(coreTeams[partyIdx].flex[0], (flex) => flex.charId === party[flexIdx]);

        if (charIdx > -1) {
          coreTeams[partyIdx].flex[0][charIdx].battleCount += battleCount;
        } else {
          coreTeams[partyIdx].flex[0].push({
            charId: party[flexIdx],
            battleCount,
            winCount,
            avgStar,
          });
        }
      } else {
        coreTeams.push({
          coreParty: coreParty,
          battleCount,
          winCount,
          avgStar,
          flex: [
            [
              {
                charId: party[flexIdx],
                battleCount,
                winCount,
                avgStar,
              },
            ],
          ],
        });
      }
    });
  });

  coreTeams = orderBy(coreTeams, 'battleCount', 'desc');
  coreTeams.forEach((team, i) => {
    team.flex[0] = orderBy(team.flex[0], 'battleCount', 'desc');
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
        return flex.battleCount / team.battleCount >= threshold;
      }),
      'battleCount',
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
      mergedTeams[teamIdx].battleCount += team.battleCount;
    } else {
      mergedTeams.push(team);
    }
  });

  return orderBy(mergedTeams, 'battleCount', 'desc');
};

function groupById(obj: any, field: string) {
  return reduce(
    obj,
    (res, curr) => {
      res[curr[field]] = res[curr[field]] || [];
      res[curr[field]].push(curr);
      return res;
    },
    {},
  );
}

export async function aggregateAll() {
  const { artifactSetDb, artifactSetBuildDb, characterDb, weaponDb } = await getDb();
  const characters = await characterModel.find();
  const characterIds = map(characters, ({ _id }) => _id);

  const allFloors = [];

  forEach(range(9, 13), (floor) => {
    forEach(range(1, 4), (stage) => {
      allFloors.push(`${floor}-${stage}`);
    });
  });

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

  // const allTopTeams = flatten(
  //   await Promise.all(
  //     flattenDeep(map(characterIds, (characterId) => abyssBattleService.getTopParties(characterId))),
  //   ),
  // );

  // const topTeams = aggregateCoreTeams(uniqWith(allTopTeams, compareParties));
  // fs.writeFileSync('data/abyss/stats/top-abyss-teams.json', JSON.stringify(topTeams));

  console.log('Done top parties');

  const allFloorTeams = flatten(
    await Promise.all(
      flattenDeep(
        map(allCharFloors, ({ floor_level, battle_index, characterId }) =>
          abyssBattleService.getTopFloorParties(floor_level, battle_index, characterId),
        ),
      ),
    ),
  );

  const groupedFloorTeams = groupBy(allFloorTeams, 'floorLevel');
  const topFloorTeams = {};

  Object.entries(groupedFloorTeams).forEach((floorData) => {
    const data = floorData[1];
    const floorLevel = floorData[0];

    const groupedBattleTeams = groupBy(data, 'battleIndex');
    Object.entries(groupedBattleTeams).forEach((battleData) => {
      const teams = uniqWith(battleData[1], compareParties);
      const battleIndex = battleData[0];

      if (!topFloorTeams[floorLevel]) topFloorTeams[floorLevel] = {};
      topFloorTeams[floorLevel][battleIndex] = aggregateCoreTeams(teams);
    });
  });

  for (const floorLevel of allFloors) {
    fs.writeFileSync(`data/abyss/${floorLevel}.json`, JSON.stringify(topFloorTeams[floorLevel]));
  }
  console.log('Done floor parties');

  // const characterConstellationCounts = groupBy(
  //   await playerCharacterService.getCharacterConstellationCount(),
  //   'characterId',
  // );

  // const characterAbyssConstellationCounts = groupBy(
  //   await abyssBattleService.getCharacterAbyssConstellationCount(),
  //   'characterId',
  // );

  // const characterAbyssStats: any = groupById(
  //   flatten(
  //     await Promise.all(
  //       flattenDeep(
  //         map(characterIds, (characterId) => abyssBattleService.getCharacterAbyssStats(characterId)),
  //       ),
  //     ),
  //   ),
  //   'characterId',
  // );
  // console.log('Done character abyss stats');

  // const characterBuilds: any = groupById(
  //   flatten(
  //     await Promise.all(
  //       flattenDeep(map(characterIds, (charId) => playerCharacterService.getCharacterBuilds(charId))),
  //     ),
  //   ),
  //   'characterId',
  // );

  // const characterCounts: any = groupById(await playerCharacterService.getCharacterCounts(), 'characterId');
  // console.log('Done character totals');

  // const characterBuildAbyssStats: any = groupById(
  //   flatten(
  //     await Promise.all(
  //       flattenDeep(map(characterIds, (charId) => abyssBattleService.getCharacterBuildAbyssStats(charId))),
  //     ),
  //   ),
  //   'characterId',
  // );
  // console.log('Done character build stats');

  // const characterBuildData: any = {};
  // forEach(characterBuilds, (builds, characterId) => {
  //   characterBuildData[characterId] = {
  //     constellations: map(
  //       orderBy(characterConstellationCounts[characterId][0].constellations, 'constellation', 'asc'),
  //       (c) => c.count,
  //     ),
  //     builds: orderBy(
  //       map(values(builds), (build) => omit(build, 'characterId')),
  //       'count',
  //       'desc',
  //     ),
  //     count: characterCounts[characterId][0].count,
  //   };
  // });

  // const characterBuildAbyssData: any = {};
  // forEach(characterBuildAbyssStats, (stats, characterId) => {
  //   characterBuildAbyssData[characterId] = {
  //     constellations: map(
  //       orderBy(characterAbyssConstellationCounts[characterId][0].constellations, 'constellation', 'asc'),
  //       (c) => c.count,
  //     ),
  //     builds: orderBy(
  //       map(values(stats), (stat) => omit(stat, 'characterId')),
  //       'count',
  //       'desc',
  //     ),
  //     count: characterAbyssStats[characterId][0].battleCount,
  //   };
  // });

  // forEach(characterIds, (characterId) => {
  //   const charData = {
  //     characterId: characterId,
  //     all: characterBuildData[characterId],
  //     abyss: characterBuildAbyssData[characterId],
  //   };

  //   fs.writeFileSync(`data/characters/${characterId.toString()}.json`, JSON.stringify(charData));
  // });
  // console.log('Done character builds');

  // const weaponCounts = await playerCharacterService.getWeaponCounts();
  // const weaponAbyssStats: any = groupById(await abyssBattleService.getWeaponAbyssStats(), 'weaponId');
  // console.log('Done weapon abyss stats');

  // const weaponTypeTotals: any = await playerCharacterService.getWeaponTypeTotals();
  // const weaponTypeAbyssTotals: any = await abyssBattleService.getWeaponTypeAbyssTotals();

  // forEach(weaponCounts, ({ weaponId, count }) => {
  //   const weaponCharacters: { characterId: string; count: number }[] = [];
  //   forEach(characterBuildAbyssStats, (buildStats) => {
  //     forEach(buildStats, ({ characterId, weapons }) => {
  //       const weaponStat = find(weapons, (weapon) => weapon.weaponId.toString() === weaponId.toString());

  //       if (weaponStat) {
  //         const charIdx = findIndex(
  //           weaponCharacters,
  //           (char) => char.characterId.toString() === characterId.toString(),
  //         );

  //         if (charIdx > -1) {
  //           weaponCharacters[charIdx].count += weaponStat.battleCount;
  //         } else {
  //           weaponCharacters.push({
  //             characterId,
  //             count: weaponStat.battleCount,
  //           });
  //         }
  //       }
  //     });
  //   });

  //   if (weaponAbyssStats[weaponId]) {
  //     const { battleCount, winCount, avgStar } = weaponAbyssStats[weaponId][0];
  //     const weapon = find(weaponDb, (weapon) => weapon._id.toString() == weaponId.toString());

  //     if (!weapon) return;

  //     const typeTotal = find(
  //       weaponTypeTotals,
  //       (typeCount) => typeCount.weaponType === weapon.type_name,
  //     ).total;

  //     const typeAbyssTotal = find(
  //       weaponTypeAbyssTotals,
  //       (typeCount) => typeCount.weaponType === weapon.type_name,
  //     ).total;

  //     const weaponData = {
  //       weaponId,
  //       count,
  //       typeTotal,
  //       typeAbyssTotal,
  //       battleCount,
  //       winCount,
  //       avgStar,
  //       characters: orderBy(weaponCharacters, 'count', 'desc'),
  //     };

  //     fs.writeFileSync(`data/weapons/${weaponId.toString()}.json`, JSON.stringify(weaponData));
  //   }
  // });

  // const artifactSetAbyssStats = groupById(
  //   await abyssBattleService.getArtifactSetBuildAbyssStats(),
  //   'artifactSetBuildId',
  // );

  // const artifactSetBuildCounts = await playerCharacterService.getArtifactSetBuildCounts();
  // console.log('Done artifactset totals');

  // const artifactSetData: any = [];
  // forEach(artifactSetBuildCounts, ({ artifactSetBuildId, count }) => {
  //   const artifactCharacters: { characterId: string; count: number }[] = [];
  //   forEach(characterBuildAbyssStats, (buildStats) => {
  //     forEach(buildStats, (buildStat) => {
  //       if (
  //         buildStat.artifactSetBuildId &&
  //         artifactSetBuildId &&
  //         buildStat.artifactSetBuildId.toString() === artifactSetBuildId.toString()
  //       ) {
  //         const charIdx = findIndex(
  //           artifactCharacters,
  //           (char) => char.characterId.toString() === buildStat.characterId.toString(),
  //         );

  //         if (charIdx > -1) {
  //           artifactCharacters[charIdx].count += buildStat.battleCount;
  //         } else {
  //           artifactCharacters.push({
  //             characterId: buildStat.characterId,
  //             count: buildStat.battleCount,
  //           });
  //         }
  //       }
  //     });
  //   });

  //   if (artifactSetAbyssStats[artifactSetBuildId]) {
  //     const { battleCount, winCount, avgStar } = artifactSetAbyssStats[artifactSetBuildId][0];

  //     artifactSetData.push({
  //       artifactSetBuildId,
  //       count,
  //       battleCount,
  //       winCount,
  //       avgStar,
  //       characters: orderBy(artifactCharacters, 'count', 'desc'),
  //     });
  //   }
  // });

  // for (const data of artifactSetDb) {
  //   const buildIds = map(
  //     filter(artifactSetBuildDb, ({ sets }) =>
  //       some(sets, (set) => data._id && set._id && data._id.toString() === set._id.toString()),
  //     ),
  //     (setBuild) => setBuild._id,
  //   );
  //   const allSetData = filter(
  //     map(buildIds, (buildId) =>
  //       find(artifactSetData, (set) => set.artifactSetBuildId.toString() === buildId.toString()),
  //     ),
  //     (data) => !!data,
  //   );

  //   const setData = {
  //     artifactSetId: data._id,
  //     artifactSetBuilds: orderBy(allSetData, 'count', 'desc'),
  //   };

  //   fs.writeFileSync(`data/artifactSets/${data._id.toString()}.json`, JSON.stringify(setData));
  // }
}
