import fs from 'fs';

import artifactSetModel from '../artifact-set/artifact-set.model';
import { ArtifactSetService } from '../artifact-set/artifact-set.service';
import artifactModel from '../artifact/artifact.model';
import { ArtifactService } from '../artifact/artifact.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import weaponModel from '../weapon/weapon.model';
import { WeaponService } from '../weapon/weapon.service';

export const aggregateDb = async () => {
  const characterService = new CharacterService(characterModel);
  const weaponService = new WeaponService(weaponModel);
  const artifactService = new ArtifactService(artifactModel);
  const artifactSetService = new ArtifactSetService(artifactSetModel, artifactModel);

  const characterData = await characterService.aggregate();
  const artifactData = await artifactService.aggregate();
  const artifactSetData = await artifactSetService.aggregate();
  const weaponData = await weaponService.aggregate();

  fs.writeFile(
    'data/db.json',
    JSON.stringify({
      characters: characterData,
      weapons: weaponData,
      artifacts: artifactData,
      artifactSets: artifactSetData,
    }),
    (e) => e,
  );
};
