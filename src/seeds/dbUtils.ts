import fs from 'fs';
import {
  cloneDeep,
  difference,
  filter,
  findIndex,
  forEach,
  isEqual,
  map,
  orderBy,
  reduce,
  uniqBy
} from 'lodash';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import artifactSetModel from '../artifact-set/artifact-set.model';
import { ArtifactSetService } from '../artifact-set/artifact-set.service';
import artifactModel from '../artifact/artifact.model';
import { ArtifactService } from '../artifact/artifact.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import playerCharacterModel from '../player-character/player-character.model';
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

const getTotal = (stats: any, min = 0) => {
  return reduce(stats, (sum, curr) => sum + (curr.count > min ? curr.count : 0), 0);
};

const aggregateCoreTeams = (parties: { party: string[]; count: number }[]) => {
  const allIndexes = [0, 1, 2, 3];
  const permIndexes = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];

  let coreTeams: { core_party: string[]; count: number; flex: { charId: string; count: number }[] }[] =
    [];

  forEach(parties, ({ party, count }) => {
    forEach(permIndexes, (coreIndexes) => {
      const coreParty = [party[coreIndexes[0]], party[coreIndexes[1]], party[coreIndexes[2]]].sort();
      const partyIdx = findIndex(coreTeams, (team) => isEqual(team.core_party, coreParty));
      const flexIdx = difference(allIndexes, coreIndexes)[0];

      if (partyIdx > -1) {
        coreTeams[partyIdx].count += count;

        const charIdx = findIndex(coreTeams[partyIdx].flex, (flex) => flex.charId === party[flexIdx]);

        if (charIdx > -1) {
          coreTeams[partyIdx].flex[charIdx].count += count;
        } else {
          coreTeams[partyIdx].flex.push({ charId: party[flexIdx], count });
        }
      } else {
        coreTeams.push({
          core_party: coreParty,
          count,
          flex: [{ charId: party[flexIdx], count }],
        });
      }
    });
  });
  
  coreTeams = uniqBy(coreTeams, ({core_party, flex}) => [...core_party, flex[0].charId].sort())
  coreTeams = orderBy(coreTeams, 'count', 'desc');
  coreTeams.forEach(team => team.flex = orderBy(team.flex, 'count', 'desc'))
  return coreTeams;
};

export const updateDb = async () => {
  const artifactData = await artifactService.aggregate();
  const artifactSetData = await artifactSetService.aggregate();
  const characterData = await characterService.aggregate();
  const weaponData = await weaponService.aggregate();
  const abyssData = await abyssBattleService.aggregate();
  // eslint-disable-next-line prefer-const
  let { weaponStats, artifactSetStats, characterBuilds, mainCharacterBuilds, characterStats } =
    await playerCharacterService.aggregate();
  const playerCount = await playerService.getStats();
  const playerCharacterCount = await playerCharacterService.getStats();
  const abyssBattleCount = await abyssBattleService.getStats();

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

  const threshold = 0.003;
  const min = 2;

  const abyssTeamTotal = getTotal(abyssData.teams, min);
  abyssData.teams = filter(abyssData.teams, (team) => team.count / abyssTeamTotal >= threshold && team.count > min)
  const topAbyssTeams = aggregateCoreTeams(abyssData.teams);

  forEach(abyssData.abyss, (floorData, floor_level) => {
    floorData.battle_parties.forEach((parties, i) => {
      const partyTotal = getTotal(parties, min);
      abyssData.abyss[floor_level].battle_parties[i] = filter(parties, (stat) => stat.count / partyTotal >= threshold && stat.count > min)
    });
  });

  const allAbyssTeams: any = cloneDeep(abyssData.abyss);
  forEach(abyssData.abyss, (floorData, floor_level) => {
    floorData.battle_parties.forEach((parties, i) => {
      allAbyssTeams[floor_level].battle_parties[i] = aggregateCoreTeams(parties);
    });
  });

  // const weaponStatsTotal = getTotal(weaponStats, min);
  // weaponStats = orderBy(
  //   filter(weaponStats, (stat) => stat.count / weaponStatsTotal >= threshold && stat.count > min),
  //   'count',
  //   'desc',
  // );
  // weaponStats.forEach((stat, i) => {
  //   const charCountsTotal = getTotal(values(stat.characters), min);
  //   stat.characters = orderBy(
  //     filter(stat.characters, (char) => char.count / charCountsTotal >= threshold * 3 && char.count > min),
  //     'count',
  //     'desc',
  //   );
  // });
  // weaponStats = filter(weaponStats, (stat) => stat.characters.length);

  // const artifactSetStatsTotal = getTotal(weaponStats, min);
  // artifactSetStats = orderBy(
  //   filter(
  //     artifactSetStats,
  //     (stat) => stat.count / artifactSetStatsTotal >= threshold / 3 && stat.count > min,
  //   ),
  //   'count',
  //   'desc',
  // );
  // artifactSetStats.forEach((stat, i) => {
  //   const charCountsTotal = getTotal(values(stat.characters), min);
  //   stat.characters = orderBy(
  //     filter(stat.characters, (char) => char.count / charCountsTotal >= threshold * 3 && char.count > min),
  //     'count',
  //     'desc',
  //   );
  // });
  // artifactSetStats = filter(artifactSetStats, (stat) => stat.characters.length);

  // characterStats = orderBy(characterStats, 'total', 'desc');

  // const filterCharacterBuilds = (builds: any) => {
  //   builds.forEach((charBuildStats) => {
  //     const buildsTotal = getTotal(charBuildStats.builds, min);
  //     charBuildStats.builds = orderBy(
  //       filter(
  //         charBuildStats.builds,
  //         (build) => build.count / buildsTotal >= threshold && build.count > min,
  //       ),
  //       'count',
  //       'desc',
  //     );
  //     charBuildStats.total = getTotal(charBuildStats.builds);

  //     charBuildStats.builds.forEach((build) => {
  //       const weaponsTotal = getTotal(build.weapons, min);
  //       build.weapons = orderBy(
  //         filter(
  //           build.weapons,
  //           (weapon) => weapon.count / weaponsTotal >= threshold && weapon.count > min,
  //         ),
  //         'count',
  //         'desc',
  //       );
  //     });

  //     const teamsTotal = getTotal(charBuildStats.teams, min);
  //     charBuildStats.teams = orderBy(
  //       filter(charBuildStats.teams, (team) => team.count / teamsTotal >= threshold && team.count > min),
  //       'count',
  //       'desc',
  //     );
  //   });
  // };

  // filterCharacterBuilds(characterBuilds);
  // filterCharacterBuilds(mainCharacterBuilds);

  await Promise.all([
    // fs.writeFile(
    //   'data/db.json',
    //   JSON.stringify({
    //     characters: characterData,
    //     weapons: weaponData,
    //     artifacts: artifactData,
    //     artifactSets: artifactSetData,
    //   }),
    //   cb,
    // ),
    fs.writeFile('data/abyss/top-teams.json', JSON.stringify(topAbyssTeams), cb),
    // fs.writeFile('data/weapons/top-weapons.json', JSON.stringify(weaponStats), cb),
    // fs.writeFile('data/artifacts/top-artifactsets.json', JSON.stringify(artifactSetStats), cb),
    // fs.writeFile('data/characters/top-characters.json', JSON.stringify(characterStats), cb),
    // fs.writeFile(
    //   'data/featured.json',
    //   JSON.stringify({
    //     player_total: playerCount,
    //     character_total: playerCharacterCount,
    //     abyss_total: abyssBattleCount,
    //     banner: ['Yoimiya', 'Sayu', 'Xinyan', 'Diona'],
    //   }),
    //   cb,
    // ),
    ...map(allAbyssTeams, (floorData) => {
      return fs.writeFile(`data/abyss/${floorData.floor_level}.json`, JSON.stringify(floorData), cb);
    }),
    // ...map(characterBuilds, (charBuild) => {
    //   const character = find(characterData, { _id: charBuild.char_id });
    //   const fileName = getShortName(character);
    //   return fs.writeFile(`data/characters/${fileName}.json`, JSON.stringify(charBuild), cb);
    // }),
    // ...map(mainCharacterBuilds, (charBuild) => {
    //   const character = find(characterData, { _id: charBuild.char_id });
    //   const fileName = getShortName(character);
    //   return fs.writeFile(`data/characters/mains/${fileName}.json`, JSON.stringify(charBuild), cb);
    // }),
  ]);

  await updateRepo(process.env.npm_config_branch);

  // Delete files to save space
  cleanup('data');

  console.log('DB UPDATE END');
};
