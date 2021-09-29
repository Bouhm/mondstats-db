import fs from 'fs';
import {
  cloneDeep,
  difference,
  filter,
  find,
  findIndex,
  flatten,
  forEach,
  includes,
  intersection,
  isEmpty,
  isEqual,
  map,
  omit,
  orderBy,
  reduce,
  some,
  take,
  values,
} from 'lodash';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import artifactSetModel from '../artifact-set/artifact-set.model';
import { ArtifactSetService } from '../artifact-set/artifact-set.service';
import artifactModel from '../artifact/artifact.model';
import { ArtifactService } from '../artifact/artifact.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import playerCharacterModel, { CharacterBuildStats } from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import playerModel from '../player/player.model';
import { PlayerService } from '../player/player.service';
import { getShortName } from '../util';
import weaponModel from '../weapon/weapon.model';
import { WeaponService } from '../weapon/weapon.service';
import { updateRepo } from './githubApi';

const playerCharacterService = new PlayerCharacterService(playerCharacterModel, abyssBattleModel);
const characterService = new CharacterService(characterModel);
const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const artifactService = new ArtifactService(artifactModel);
const artifactSetService = new ArtifactSetService(artifactSetModel, artifactModel);
const weaponService = new WeaponService(weaponModel);
const playerService = new PlayerService(playerModel);
const charCounts = {};
const db = JSON.parse(fs.readFileSync(`test/db.json`, 'utf-8'));

type Flex = { charId: string; count: number };
const cleanup = (dirPath, removeSelf = false) => {
  const files = fs.readdirSync(dirPath);

  if (files.length > 0)
    for (let i = 0; i < files.length; i++) {
      const filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else cleanup(filePath);
    }
  if (removeSelf) fs.rmdirSync(dirPath);
};

const printTeam = (team: any) => {
  let teamStr = ''
  teamStr += map(team.core_party, char => getChar(char).name).join(', ')
  teamStr += '; flex: ' + map(team.flex[0], ({charId}) => getChar(charId).name).join(', ')

  console.log(teamStr)
}

const getChar = (_id: string) => find(db.characters, { _id });

const getTotal = (stats: any, min = 0) => {
  return reduce(stats, (sum, curr) => sum + (curr.count >= min ? curr.count : 0), 0);
};

const resetCharCounts = (characters: any) => forEach(characters, ({ _id }) => (charCounts[_id] = 0));

const aggregateCoreTeams = (parties: { party: string[]; count: number }[]) => {
  // const allIndexes = [0, 1, 2, 3];
  // const permIndexes = [
  //   [0, 1, 2],
  //   [0, 1, 3],
  //   [0, 2, 3],
  //   [1, 2, 3],
  // ];

  // let coreTeams: { core_party: string[]; count: number; flex: Flex[][] }[] = [];

  // forEach(parties, ({ party, count }) => {
  //   forEach(permIndexes, (coreIndexes) => {
  //     const coreParty = [party[coreIndexes[0]], party[coreIndexes[1]], party[coreIndexes[2]]].sort();
  //     const partyIdx = findIndex(coreTeams, (team) => {
  //       return (
  //         isEqual(team.core_party, coreParty) &&
  //         intersection(map(team.flex[0], (flex) => flex.charId)).length > 0
  //       );
  //     });
  //     const flexIdx = difference(allIndexes, coreIndexes)[0];

  //     if (partyIdx > -1) {
  //       coreTeams[partyIdx].count += count;
  //       const charIdx = findIndex(coreTeams[partyIdx].flex[0], (flex) => flex.charId === party[flexIdx]);

  //       if (charIdx > -1) {
  //         coreTeams[partyIdx].flex[0][charIdx].count += count;
  //       } else {
  //         coreTeams[partyIdx].flex[0].push({ charId: party[flexIdx], count });
  //       }
  //     } else {
  //       coreTeams.push({
  //         core_party: coreParty,
  //         count,
  //         flex: [[{ charId: party[flexIdx], count }]],
  //       });
  //     }
  //   });
  // });

  // coreTeams = orderBy(coreTeams, 'count', 'desc');
  // coreTeams.forEach((team, i) => {
  //   team.flex[0] = orderBy(team.flex[0], 'count', 'desc');
  // });

  let coreTeams = parties;
  const combinedTeams = [];
  while (coreTeams.length) {
    const team1 = coreTeams[0];
    const compareTeams = cloneDeep(coreTeams.slice(1));
    const coreTeams2 = [];
    let prevCoreTeamsLen = coreTeams.length;

    for (let i = 0; i < compareTeams.length; i++) {
      if (difference(
        compareTeams[i].party,
        team1.party
      ).length === 1) {
        coreTeams2.push(compareTeams[i])
        coreTeams.splice(i, 1)
      }
    }

    // console.log("NEW ITER")
    // if (some(team1.core_party, char => getChar(char).name === 'Ganyu')) {
    //   printTeam(team1)

    //   forEach(coreTeams2, team2 => {
    //     printTeam(team2)
    //   })
    // }

    let coreTeam: any = { flex: [], core_party: [], count: 0 };
    forEach(coreTeams2, (team2) => {
      // team1.count += team2.count;
      const flexChar = difference(team1.party, team2.party)[0];
      const otherChar = difference(team2.party, team1.party)[0];
      coreTeam.core_party = intersection(team1.party, team2.party);

      const flexIdx = findIndex(coreTeam.flex, flex => flex[0].charId === difference)
      if (flexIdx > -1) {
        forEach(coreTeam.flex[flexIdx], flex => {
          
        })
        const flexCharIdx = findIndex(coreTeam.flex[flexIdx], (flex: any) => flex.charId === flexChar)

        if (flexCharIdx > -1) {
          coreTeam.flex[flexIdx][flexCharIdx].count += team1.count
          const otherCharIdx = findIndex(coreTeam.flex[flexIdx], (flex: any) => flex.charId === otherChar)

          if (otherCharIdx > -1) { 
            coreTeam.flex[flexIdx][otherCharIdx].count += team2.count
          } else {
            coreTeam.flex[flexIdx].push({
              charId: otherChar,
              count: team2.count
            })
          }
        } else {
          coreTeam.flex[flexIdx].push(
            {
              charId: flexChar,
              count: team1.count
            },
            {
              charId: otherChar,
              count: team2.count
            }
          )
        }
      } else {
        coreTeam.flex.push([
          {
            charId: flexChar,
            count: team1.count
          },
          {
            charId: otherChar,
            count: team2.count
          }
        ])
      }
    });

    if (!isEmpty(coreTeam)) combinedTeams.push(coreTeam);
    if (prevCoreTeamsLen === coreTeams.length) coreTeams = coreTeams.slice(1)
  }

  const threshold = 0.25;
  combinedTeams.forEach((team) => {
    // const flexTotal = getTotal(team.flex);

    team.flex.forEach(flex => {
      flex = orderBy(
        filter(flex, (_flex) => {
          return _flex.count / team.count >= threshold;
        }),
        'count',
        'desc',
      );
    })
  });

  // const mergedTeams = [];
  // combinedTeams.forEach((team) => {
  //   const teamIdx = findIndex(mergedTeams, (_team) => {
  //     if ((team.flex[0] && !team.flex[0].length) || (_team.flex[0] && !_team.flex[0].length)) return false;

  //     return isEqual(
  //       [...team.core_party, team.flex[0][0].charId].sort(),
  //       [..._team.core_party, _team.flex[0][0].charId].sort(),
  //     );
  //   });

  //   if (teamIdx > -1) {
  //     mergedTeams[teamIdx].flex.push(team.flex[0]);
  //   } else {
  //     mergedTeams.push(team);
  //   }
  // });

  return orderBy(combinedTeams, 'count', 'desc');
};

export const updateDb = async () => {
  let abyssData,
    characterData,
    artifactData,
    artifactSetData,
    weaponData,
    playerCount,
    playerCharacterCount,
    abyssBattleCount,
    allWeaponStats,
    allArtifactSetStats,
    characterBuilds,
    mainCharacterBuilds,
    allCharacterStats;

  if (process.env.npm_config_mode !== 'test') {
    abyssData = await abyssBattleService.aggregate();
    characterData = await characterService.aggregate();
    artifactData = await artifactService.aggregate();
    artifactSetData = await artifactSetService.aggregate();
    weaponData = await weaponService.aggregate();
    playerCount = await playerService.getStats();
    playerCharacterCount = await playerCharacterService.getStats();
    abyssBattleCount = await abyssBattleService.getStats();
    fs.writeFileSync(`test/abyssData.json`, JSON.stringify(abyssData));

    // eslint-disable-next-line prefer-const
    ({ allWeaponStats, allArtifactSetStats, characterBuilds, mainCharacterBuilds, allCharacterStats } =
      await playerCharacterService.aggregate());
  }

  if (process.env.npm_config_mode === 'test') {
    abyssData = JSON.parse(fs.readFileSync(`test/abyssData.json`, 'utf-8'));
  }

  const dirs = ['characters', 'artifacts', 'weapons', 'abyss'];
  const cb = (e) => e;

  if (!fs.existsSync('data')) {
    fs.mkdir('data', { recursive: true }, cb);
  }

  await Promise.all(
    map(dirs, (dir) => {
      if (!fs.existsSync(`data/${dir}`)) {
        return fs.mkdir(`data/${dir}`, { recursive: true }, cb);
      }
    }),
  );

  if (!fs.existsSync(`data/characters/mains`)) {
    fs.mkdir(`data/characters/mains`, { recursive: true }, cb);
  }

  const abyssThreshold = 0.001;
  const weaponThreshold = 0.003;
  const weaponCharsThreshold = 0.009;
  const artifactThreshold = 0.001;
  const artifactCharsThreshold = 0.009;
  const buildThreshold = 0.003;
  const min = 3;
  const charCountMin = 20;

  resetCharCounts(characterData);
  const abyssTeamTotal = getTotal(abyssData.teams, min);
  const totalAbyssTeams = filter(abyssData.teams, (team) => {
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

  resetCharCounts(characterData);
  forEach(abyssData.abyss, (floorData, floor_level) => {
    floorData.battle_parties.forEach((parties, i) => {
      const partyTotal = getTotal(parties, min);
      abyssData.abyss[floor_level].battle_parties[i] = filter(parties, (stat) => {
        let shouldCollectForChar = false;
        forEach(stat.party, (char) => {
          if (charCounts[char] < charCountMin) {
            charCounts[char]++;
            shouldCollectForChar = true;
          }
        });
        return shouldCollectForChar || (stat.count / partyTotal >= abyssThreshold && stat.count >= min);
      });
    });
  });

  const allAbyssTeams: any = cloneDeep(abyssData.abyss);
  forEach(abyssData.abyss, (floorData, floor_level) => {
    floorData.battle_parties.forEach((parties, i) => {
      allAbyssTeams[floor_level].battle_parties[i] = aggregateCoreTeams(parties);
    });
  });

  if (process.env.npm_config_mode !== 'test') {
    const weaponStatsTotal = getTotal(allWeaponStats, min);
    allWeaponStats = orderBy(
      filter(
        allWeaponStats,
        (stat) => stat.count / weaponStatsTotal >= weaponThreshold && stat.count >= min,
      ),
      'count',
      'desc',
    );
    allWeaponStats.forEach((stat, i) => {
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
    allWeaponStats = filter(allWeaponStats, (stat) => stat.characters.length);

    const artifactSetStatsTotal = getTotal(allWeaponStats, min);
    allArtifactSetStats = orderBy(
      filter(
        allArtifactSetStats,
        (stat) => stat.count / artifactSetStatsTotal >= artifactThreshold && stat.count >= min,
      ),
      'count',
      'desc',
    );
    allArtifactSetStats.forEach((stat, i) => {
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
    allArtifactSetStats = filter(allArtifactSetStats, (stat) => stat.characters.length);

    allCharacterStats = orderBy(allCharacterStats, 'total', 'desc');

    const weaponStats: {
      _id: string;
      total: number;
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
      total: number;
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
            const allArtifactStat = find(allArtifactSetStats, (set) =>
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
                total: build.count,
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
              });
            }

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
                total: weapon.count,
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

    filterCharacterBuilds(characterBuilds);
    filterCharacterBuilds(mainCharacterBuilds);

    await Promise.all([
      fs.writeFile(
        'data/db.json',
        JSON.stringify({
          characters: characterData,
          weapons: weaponData,
          artifacts: artifactData,
          artifactSets: artifactSetData,
        }),
        cb,
      ),
      fs.writeFile('data/weapons/top-weapons.json', JSON.stringify(allWeaponStats), cb),
      fs.writeFile('data/weapons/weapon-stats.json', JSON.stringify(weaponStats), cb),
      fs.writeFile('data/artifacts/top-artifactsets.json', JSON.stringify(allArtifactSetStats), cb),
      fs.writeFile('data/artifacts/artifactset-stats.json', JSON.stringify(artifactSetStats), cb),
      fs.writeFile('data/characters/top-characters.json', JSON.stringify(allCharacterStats), cb),
      fs.writeFile(
        'data/featured.json',
        JSON.stringify({
          player_total: playerCount,
          character_total: playerCharacterCount,
          abyss_total: abyssBattleCount,
          banner: ['Sangonomiya Kokomi', 'Xingqiu', 'Beidou', 'Rosaria'],
        }),
        cb,
      ),
      ...map(characterBuilds, (charBuild) => {
        const character = find(characterData, { _id: charBuild.char_id });
        const fileName = getShortName(character);
        return fs.writeFile(`data/characters/${fileName}.json`, JSON.stringify(charBuild), cb);
      }),
      ...map(mainCharacterBuilds, (charBuild) => {
        const character = find(characterData, { _id: charBuild.char_id });
        const fileName = getShortName(character);
        return fs.writeFile(`data/characters/mains/${fileName}.json`, JSON.stringify(charBuild), cb);
      }),
      fs.writeFile('data/abyss/top-teams.json', JSON.stringify(topAbyssTeams), cb),
      ...map(allAbyssTeams, (floorData) => {
        return fs.writeFile(`data/abyss/${floorData.floor_level}.json`, JSON.stringify(floorData), cb);
      }),
      ...map(allAbyssTeams, (floorData) => {
        return fs.writeFile(`data/abyss/${floorData.floor_level}.json`, JSON.stringify(floorData), cb);
      }),
    ]);

    await updateRepo(process.env.npm_config_branch);

    // // Delete files to save space
    cleanup('data');
  } else {
    await Promise.all([
      fs.writeFile('test/top-teams.json', JSON.stringify(topAbyssTeams), cb),
      fs.writeFile('test/abyssFloors.json', JSON.stringify(allAbyssTeams), cb),
    ]);
  }

  console.log('DB UPDATE END');
};
