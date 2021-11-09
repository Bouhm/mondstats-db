import fs from 'fs';

import artifactSetModel from '../artifact-set/artifact-set.model';
import { ArtifactSetService } from '../artifact-set/artifact-set.service';
import artifactModel from '../artifact/artifact.model';
import { ArtifactService } from '../artifact/artifact.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import weaponModel from '../weapon/weapon.model';
import { WeaponService } from '../weapon/weapon.service';

const characterService = new CharacterService(characterModel);
const weaponService = new WeaponService(weaponModel);
const artifactService = new ArtifactService(artifactModel);
const artifactSetService = new ArtifactSetService(artifactSetModel, artifactModel);

export const getDb = async () => {
  const characterDb = await characterService.db();
  const artifactDb = await artifactService.db();
  const artifactSetDb = await artifactSetService.db();
  const weaponDb = await weaponService.db();
  return { characterDb, artifactDb, artifactSetDb, weaponDb };
};

export const updateDb = async () => {
  const { characterDb, weaponDb, artifactDb, artifactSetDb } = await getDb();

  fs.writeFile(
    'data/db.json',
    JSON.stringify({
      characters: characterDb,
      weapons: weaponDb,
      artifacts: artifactDb,
      artifactSets: artifactSetDb,
    }),
    (e) => e,
  );
};
