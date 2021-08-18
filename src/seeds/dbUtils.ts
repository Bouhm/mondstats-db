import fs from 'fs';
import { filter, find, map, orderBy, reduce, values } from 'lodash';

import { mixin } from '@nestjs/common';

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

const getTotal = (stats: any, min: number) => {
  return reduce(stats, (sum, curr) => (sum + curr.count > min ? curr.count : 0), 0);
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

  const threshold = 0.005;
  const min = 2;

  const abyssTeamTotal = getTotal(abyssData.teams, min);
  abyssData.teams = orderBy(
    filter(abyssData.teams, (team) => team.count / abyssTeamTotal >= threshold && team.count > min),
    'count',
    'desc',
  );

  const weaponStatsTotal = getTotal(weaponStats, min);
  weaponStats = orderBy(
    filter(weaponStats, (stat) => stat.count / weaponStatsTotal >= threshold && stat.count > min),
    'count',
    'desc',
  );
  weaponStats.forEach((stat, i) => {
    const charCountsTotal = getTotal(values(stat.characters), min);
    stat.characters = orderBy(
      filter(stat.characters, (char) => char.count / charCountsTotal >= threshold * 3 && char.count > min),
      'count',
      'desc',
    );
  });
  weaponStats = filter(weaponStats, (stat) => stat.characters.length);

  const artifactSetStatsTotal = getTotal(weaponStats, min);
  artifactSetStats = orderBy(
    filter(
      artifactSetStats,
      (stat) => stat.count / artifactSetStatsTotal >= threshold / 3 && stat.count > min,
    ),
    'count',
    'desc',
  );
  artifactSetStats.forEach((stat, i) => {
    const charCountsTotal = getTotal(values(stat.characters), min);
    stat.characters = orderBy(
      filter(stat.characters, (char) => char.count / charCountsTotal >= threshold * 3 && char.count > min),
      'count',
      'desc',
    );
  });
  artifactSetStats = filter(artifactSetStats, (stat) => stat.characters.length);

  characterStats = orderBy(characterStats, 'total', 'desc');
  abyssData.abyss.forEach((floorData) => {
    floorData.battle_parties.forEach((parties) => {
      const partyTotal = getTotal(parties, min);
      parties = orderBy(
        filter(parties, (stat) => stat.count / partyTotal >= threshold && stat.count > min),
        'count',
        'desc',
      );
    });
  });

  characterBuilds.forEach((charBuildStats) => {
    const buildsTotal = getTotal(charBuildStats.builds, min);
    charBuildStats.builds = orderBy(
      filter(
        charBuildStats.builds,
        (build) => build.count / buildsTotal >= threshold && build.count > min,
      ),
      'count',
      'desc',
    );

    charBuildStats.builds.forEach((build) => {
      const weaponsTotal = getTotal(build.weapons, min);
      build.weapons = orderBy(
        filter(build.weapons, (weapon) => weapon.count / weaponsTotal >= threshold && weapon.count > min),
        'count',
        'desc',
      );
    });

    const teamsTotal = getTotal(charBuildStats.teams, min);
    charBuildStats.teams = orderBy(
      filter(charBuildStats.teams, (team) => team.count / teamsTotal >= threshold && team.count > min),
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
