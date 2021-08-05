import fs from 'fs';
import { filter, find, map, orderBy, pickBy, reduce, values } from 'lodash';

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

export const updateDb = async () => {
  const artifactData = await artifactService.aggregate();
  const artifactSetData = await artifactSetService.aggregate();
  const characterData = await characterService.aggregate();
  const weaponData = await weaponService.aggregate();
  const abyssData = await abyssBattleService.aggregate();
  // eslint-disable-next-line prefer-const
  let { weaponStats, artifactSetStats, characterBuilds, characterStats } =
    await playerCharacterService.aggregate();
  const playerCount = await playerService.getStats();
  const playerCharacterCount = await playerCharacterService.getStats();

  const dirs = ['characters', 'artifacts', 'weapons', 'abyss'];
  const cb = (e) => {
    e;
  };

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

  const threshold = 0.005;

  const abyssTeamTotal = reduce(abyssData.teams, (sum, curr) => sum + curr.count, 0);
  abyssData.teams = orderBy(
    filter(abyssData.teams, (team) => team.count / abyssTeamTotal >= threshold),
    'count',
    'desc',
  );

  const weaponStatsTotal = reduce(weaponStats, (sum, curr) => sum + curr.count, 0);
  weaponStats = filter(weaponStats, (stat) => stat.count / weaponStatsTotal >= threshold);
  weaponStats.forEach((stat) => {
    const charCountsTotal = reduce(values(stat.characters), (sum, curr) => sum + curr.count, 0);
    stat.characters = orderBy(
      filter(stat.characters, (char) => char.count / charCountsTotal >= threshold * 2),
      'count',
      'desc',
    );
  });

  const artifactSetStatsTotal = reduce(weaponStats, (sum, curr) => sum + curr.count, 0);
  artifactSetStats = filter(artifactSetStats, (stat) => stat.count / artifactSetStatsTotal >= threshold);
  artifactSetStats.forEach((stat) => {
    const charCountsTotal = reduce(values(stat.characters), (sum, curr) => sum + curr.count, 0);
    stat.characters = orderBy(
      filter(stat.characters, (char) => char.count / charCountsTotal >= threshold * 2),
      'count',
      'desc',
    );
  });

  characterStats = orderBy(characterStats, 'total', 'desc');

  abyssData.abyss.forEach((floorData) => {
    floorData.battle_parties.forEach((parties) => {
      const partyTotal = reduce(parties, (sum, curr) => sum + curr.count, 0);
      parties = orderBy(
        filter(parties, (stat) => stat.count / partyTotal >= threshold),
        'count',
        'desc',
      );
    });
  });

  characterBuilds.forEach((charBuildStats) => {
    const buildsTotal = reduce(charBuildStats.builds, (sum, curr) => sum + curr.count, 0);
    charBuildStats.builds = orderBy(
      filter(charBuildStats.builds, (build) => build.count / buildsTotal >= threshold),
      'count',
      'desc',
    );

    charBuildStats.builds.forEach((build) => {
      const weaponsTotal = reduce(build.weapons, (sum, curr) => sum + curr.count, 0);
      build.weapons = orderBy(
        filter(build.weapons, (weapon) => weapon.count / weaponsTotal >= threshold),
        'count',
        'desc',
      );
    });

    const teamsTotal = reduce(charBuildStats.teams, (sum, curr) => sum + curr.count, 0);
    charBuildStats.teams = orderBy(
      filter(charBuildStats.teams, (team) => team.count / teamsTotal >= threshold),
      'count',
      'desc',
    );
  });

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
    fs.writeFile('data/abyss/top-teams.json', JSON.stringify(abyssData.teams), cb),
    fs.writeFile('data/weapons/top-weapons.json', JSON.stringify(weaponStats), cb),
    fs.writeFile('data/artifacts/top-artifactsets.json', JSON.stringify(artifactSetStats), cb),
    fs.writeFile('data/characters/top-characters.json', JSON.stringify(characterStats), cb),
    fs.writeFile(
      'data/featured.json',
      JSON.stringify({ player_total: playerCount, character_total: playerCharacterCount }),
      cb,
    ),
    ...map(abyssData.abyss, (floorData) => {
      return fs.writeFile(`data/abyss/${floorData.floor_level}.json`, JSON.stringify(floorData), cb);
    }),
    ...map(characterBuilds, (charBuild) => {
      const character = find(characterData, { _id: charBuild.char_id });
      const fileName = getShortName(character);
      return fs.writeFile(`data/characters/${fileName}.json`, JSON.stringify(charBuild), cb);
    }),
  ]);

  await updateRepo();

  // Delete files to save space
  cleanup('data');

  console.log('DB UPDATE END');
};
