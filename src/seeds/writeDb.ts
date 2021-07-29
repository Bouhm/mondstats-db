import fs from 'fs';
import { find, forEach } from 'lodash';
import mongoose from 'mongoose';

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
import { getShortName } from '../util';
import connectDb from '../util/connection';
import weaponModel from '../weapon/weapon.model';
import { WeaponService } from '../weapon/weapon.service';
import { updateDb } from './githubApi';

const playerCharacterService = new PlayerCharacterService(playerCharacterModel, abyssBattleModel);
const characterService = new CharacterService(characterModel);
const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const artifactService = new ArtifactService(artifactModel);
const artifactSetService = new ArtifactSetService(artifactSetModel, artifactModel);
const weaponService = new WeaponService(weaponModel);

(async () => {
  connectDb();

  const artifactData = await artifactService.aggregate();
  const artifactSetData = await artifactSetService.aggregate();
  const characterData = await characterService.aggregate();
  const weaponData = await weaponService.aggregate();
  const abyssData = await abyssBattleService.aggregate();
  const { weaponStats, artifactSetStats, characterStats, characterBuilds } =
    await playerCharacterService.aggregate();

  fs.writeFileSync(
    'data/db.json',
    JSON.stringify({
      characters: characterData,
      weapons: weaponData,
      artifacts: artifactData,
      artifactSets: artifactSetData,
    }),
  );

  fs.writeFileSync('data/abyss/top-teams.json', JSON.stringify(abyssData.teams));
  fs.writeFileSync('data/weapons/top-weapons.json', JSON.stringify(weaponStats));
  fs.writeFileSync('data/artifacts/top-artifactsets.json', JSON.stringify(artifactSetStats));
  fs.writeFileSync('data/characters/top-characters.json', JSON.stringify(characterStats));

  forEach(abyssData.abyss, (floorData) => {
    fs.writeFileSync(`data/abyss/${floorData.floor_level}.json`, JSON.stringify(floorData));
  });

  forEach(characterBuilds, (charBuild) => {
    const character = find(characterData, { _id: charBuild.char_id });
    const fileName = getShortName(character);
    fs.writeFileSync(`data/characters/${fileName}.json`, JSON.stringify(charBuild));
  });

  await updateDb();

  mongoose.connection.close();
})();
