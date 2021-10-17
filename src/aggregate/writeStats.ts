/* eslint-disable prefer-const */
import fs from 'fs';
import {
  cloneDeep,
  difference,
  filter,
  find,
  findIndex,
  forEach,
  includes,
  intersection,
  isEqual,
  map,
  orderBy,
  values,
} from 'lodash';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import playerCharacterModel, { CharacterBuildStats } from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import { getShortName, getTotal } from '../util';
import { getDb } from './writeDb';

type Flex = { charId: string; count: number };

const aggregateCoreTeams = (parties: { party: string[]; count: number }[]) => {
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

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);

export const aggregateStats = async () => {
  let topWeaponStats, topArtifactSetStats, topCharacterStats, characterBuilds, mainCharacterBuilds;
  const { characterDb, weaponDb, artifactSetDb } = await getDb();
  const charCounts = {};
  const abyssThreshold = 0.0005;
  const weaponThreshold = 0.005;
  const weaponCharsThreshold = 0.01;
  const artifactThreshold = 0.003;
  const artifactCharsThreshold = 0.01;
  const buildThreshold = 0.005;
  const min = 10;
  const charCountMin = 100;

  const resetCharCounts = () => {
    forEach(
      map(characterDb, (char) => char._id),
      ({ _id }) => (charCounts[_id] = 0),
    );
  };

  const abyssData = await abyssBattleService.aggregate();
  console.log('Done abyss aggregation');

  ({ topWeaponStats, topArtifactSetStats, topCharacterStats, characterBuilds, mainCharacterBuilds } =
    await playerCharacterService.aggregate(abyssData.charTeams, abyssData.abyssUsage));
  console.log('Done player character aggregation');

  resetCharCounts();
  const abyssTeamTotal = getTotal(abyssData.teams, min);
  const totalAbyssTeams = filter(orderBy(abyssData.teams, 'count', 'desc'), (team) => {
    let shouldCollectForChar = false;
    forEach(team.party, (char) => {
      if (charCounts[char] < charCountMin) {
        charCounts[char]++;
        shouldCollectForChar = true;
      }
    });
    return shouldCollectForChar || (team.count / abyssTeamTotal >= abyssThreshold && team.count >= min);
  });
  const topAbyssTeams = aggregateCoreTeams(totalAbyssTeams);

  resetCharCounts();
  forEach(abyssData.abyss, (floorData, floor_level) => {
    floorData.battle_parties.forEach((parties, i) => {
      const partyTotal = getTotal(parties, min);
      abyssData.abyss[floor_level].battle_parties[i] = filter(
        orderBy(parties, 'count', 'desc'),
        (stat) => {
          let shouldCollectForChar = false;
          forEach(stat.party, (char) => {
            if (charCounts[char] < charCountMin) {
              charCounts[char]++;
              shouldCollectForChar = true;
            }
          });
          return shouldCollectForChar || (stat.count / partyTotal >= abyssThreshold && stat.count >= min);
        },
      );
    });
  });

  const allAbyssTeams: any = cloneDeep(abyssData.abyss);
  forEach(abyssData.abyss, (floorData, floor_level) => {
    floorData.battle_parties.forEach((parties, i) => {
      allAbyssTeams[floor_level].battle_parties[i] = aggregateCoreTeams(parties);
    });
  });
  console.log('Done abyss team aggregation');

  const weaponStats: {
    _id: string;
    count: number;
    abyssCount: number;
    abyssWins: number;
    characters: {
      _id: string;
      count: number;
    }[];
    artifactSets: {
      artifacts: {
        _id: string;
        activation_number: number;
      }[];
      count: number;
    }[];
  }[] = [];

  const artifactSetStats: {
    artifacts: {
      _id: string;
      activation_number: number;
    }[];
    count: number;
    abyssCount: number;
    abyssWins: number;
    characters: {
      _id: string;
      count: number;
    }[];
    weapons: {
      _id: string;
      count: number;
    }[];
  }[] = [];

  const filterCharacterBuilds = (builds: CharacterBuildStats[]) => {
    builds.forEach((charBuildStats) => {
      forEach(charBuildStats.builds, (build) => {
        forEach(build.weapons, (weapon) => {
          const allArtifactStat = find(topArtifactSetStats, (set) =>
            isEqual(set.artifacts, build.artifacts),
          );

          const artifactStatsIdx = findIndex(artifactSetStats, (stat) =>
            isEqual(stat.artifacts, build.artifacts),
          );

          if (artifactStatsIdx > -1) {
            const characterIdx = findIndex(
              artifactSetStats[artifactStatsIdx].characters,
              (character) => character._id === charBuildStats.char_id,
            );
            if (characterIdx > -1) {
              artifactSetStats[artifactStatsIdx].characters[characterIdx].count += weapon.count;
            } else {
              artifactSetStats[artifactStatsIdx].characters.push({
                _id: charBuildStats.char_id,
                count: build.count,
              });
            }
          } else {
            artifactSetStats.push({
              artifacts: build.artifacts,
              count: build.count,
              characters: [
                {
                  _id: charBuildStats.char_id,
                  count: weapon.count,
                },
              ],
              weapons: [
                {
                  _id: weapon._id,
                  count: weapon.count,
                },
              ],
              abyssCount: allArtifactStat.abyssCount,
              abyssWins: allArtifactStat.abyssWins,
            });
          }

          const allWeaponStat = find(topWeaponStats, (weaponStat) => weaponStat._id === weapon._id);
          const weaponStatsIdx = findIndex(weaponStats, (stat) => stat._id === weapon._id);

          if (weaponStatsIdx > -1) {
            const characterIdx = findIndex(
              weaponStats[weaponStatsIdx].characters,
              (character) => character._id === charBuildStats.char_id,
            );
            if (characterIdx > -1) {
              weaponStats[weaponStatsIdx].characters[characterIdx].count += weapon.count;
            } else {
              weaponStats[weaponStatsIdx].characters.push({
                _id: charBuildStats.char_id,
                count: weapon.count,
              });
            }
          } else {
            weaponStats.push({
              _id: weapon._id,
              count: weapon.count,
              characters: [
                {
                  _id: charBuildStats.char_id,
                  count: weapon.count,
                },
              ],
              artifactSets: [
                {
                  artifacts: build.artifacts,
                  count: build.count,
                },
              ],
              abyssCount: allWeaponStat.abyssCount,
              abyssWins: allWeaponStat.abyssWins,
            });
          }
        });
      });

      const buildsTotal = getTotal(charBuildStats.builds, min);
      charBuildStats.builds = orderBy(
        filter(
          charBuildStats.builds,
          (build) => build.count / buildsTotal >= buildThreshold && build.count >= min,
        ),
        'count',
        'desc',
      );
      charBuildStats.total = getTotal(charBuildStats.builds);

      // charBuildStats.builds.forEach((build) => {
      //   const weaponsTotal = getTotal(build.weapons, min);
      //   build.weapons = orderBy(
      //     filter(
      //       build.weapons,
      //       (weapon) => weapon.count / weaponsTotal >= buildThreshold && weapon.count >= min,
      //     ),
      //     'count',
      //     'desc',
      //   );
      // });

      const teamsTotal = getTotal(charBuildStats.teams, min);
      charBuildStats.teams = orderBy(
        filter(
          charBuildStats.teams,
          (team) => team.count / teamsTotal >= buildThreshold && team.count >= min,
        ),
        'count',
        'desc',
      );
    });
  };
  console.log('Done character builds');

  filterCharacterBuilds(characterBuilds);
  filterCharacterBuilds(mainCharacterBuilds);

  const weaponStatsTotal = getTotal(topWeaponStats, min);
  topWeaponStats = orderBy(
    filter(
      topWeaponStats,
      (stat) => stat.count / weaponStatsTotal >= weaponThreshold && stat.count >= min,
    ),
    'count',
    'desc',
  );
  topWeaponStats.forEach((stat, i) => {
    const charCountsTotal = getTotal(values(stat.characters), min);
    stat.characters = orderBy(
      filter(
        stat.characters,
        (char) => char.count / charCountsTotal >= weaponCharsThreshold && char.count >= min,
      ),
      'count',
      'desc',
    );
  });
  topWeaponStats = filter(topWeaponStats, (stat) => stat.characters.length);

  const artifactSetStatsTotal = getTotal(topArtifactSetStats, min);
  topArtifactSetStats = orderBy(
    filter(
      topArtifactSetStats,
      (stat) => stat.count / artifactSetStatsTotal >= artifactThreshold && stat.count >= min,
    ),
    'count',
    'desc',
  );
  topArtifactSetStats.forEach((stat, i) => {
    const charCountsTotal = getTotal(values(stat.characters), min);
    stat.characters = orderBy(
      filter(
        stat.characters,
        (char) => char.count / charCountsTotal >= artifactCharsThreshold && char.count >= min,
      ),
      'count',
      'desc',
    );
  });
  topArtifactSetStats = filter(topArtifactSetStats, (stat) => stat.characters.length);
  topCharacterStats = orderBy(topCharacterStats, 'total', 'desc');

  const weaponStatsTotals: any = {};
  const artifactSetStatsTotals: any = {};
  // const characterStatsTotals: any = {};

  forEach(weaponStats, (weaponStat) => {
    const weapon = find(weaponDb, { _id: weaponStat._id });
    if (!weapon) return;

    weaponStatsTotals.all.total += weaponStat.count;
    weaponStatsTotals.all.abyssTotal += weaponStat.abyssCount;
    weaponStatsTotals[weapon.type_name.toLowerCase()].total += weaponStat.count;
    weaponStatsTotals[weapon.type_name.toLowerCase()].abyssTotal += weaponStat.abyssCount;
  });

  forEach(artifactSetStats, (artifactSetStat) => {
    artifactSetStatsTotals.total += artifactSetStat.count;
    artifactSetStatsTotals.abyssTotal += artifactSetStat.abyssCount;
  });

  await Promise.all([
    fs.writeFile('data/weapons/stats/top-weapons.json', JSON.stringify(topWeaponStats), (e) => e),
    fs.writeFile('data/weapons/stats/weapon-totals.json', JSON.stringify(weaponStatsTotals), (e) => e),
    ...map(weaponStats, (weaponStat) => {
      const weapon = find(weaponDb, { _id: weaponStat._id });
      if (!weapon) return;
      const fileName = getShortName(weapon);
      return fs.writeFile(`data/weapons/${fileName}.json`, JSON.stringify(weaponStat), (e) => e);
    }),
    fs.writeFile(
      'data/artifacts/stats/top-artifactsets.json',
      JSON.stringify(topArtifactSetStats),
      (e) => e,
    ),
    fs.writeFile(
      'data/artifacts/stats/artifactset-totals.json',
      JSON.stringify(artifactSetStatsTotals),
      (e) => e,
    ),
    ...map(artifactSetStats, (artifactSetStat) => {
      const artifactSets = filter(artifactSetDb, (artifactSet) =>
        includes(
          map(artifactSetStat.artifacts, (set) => set._id),
          artifactSet._id,
        ),
      );

      const fileName = map(
        artifactSets,
        (artifactSet, i) =>
          `${artifactSetStat.artifacts[i].activation_number}${getShortName(artifactSet)}`,
      ).join('-');
      return fs.writeFile(`data/artifacts/${fileName}.json`, JSON.stringify(artifactSetStat), (e) => e);
    }),
    fs.writeFile('data/characters/stats/top-characters.json', JSON.stringify(topCharacterStats), (e) => e),
    // fs.writeFile(
    //   'data/characters/stats/character-totals.json',
    //   JSON.stringify(characterStatsTotals),
    //   (e) => e,
    // ),
    ...map(characterBuilds, (charBuild) => {
      const character = find(characterDb, { _id: charBuild.char_id });
      const fileName = getShortName(character);
      return fs.writeFile(`data/characters/${fileName}.json`, JSON.stringify(charBuild), (e) => e);
    }),
    ...map(mainCharacterBuilds, (charBuild) => {
      const character = find(characterDb, { _id: charBuild.char_id });
      const fileName = getShortName(character);
      return fs.writeFile(`data/characters/mains/${fileName}.json`, JSON.stringify(charBuild), (e) => e);
    }),
    fs.writeFile('data/abyss/stats/top-abyss-teams.json', JSON.stringify(topAbyssTeams), (e) => e),
    ...map(allAbyssTeams, (floorData) => {
      return fs.writeFile(`data/abyss/${floorData.floor_level}.json`, JSON.stringify(floorData), (e) => e);
    }),
  ]);
};
