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
  includes,
  intersection,
  isEqual,
  map,
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
import { CharacterService } from '../character/character.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import connectDb from '../util/connection';
import { getDb } from './writeDb';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);

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

(async () => {
  await connectDb();
  const { artifactSetDb, artifactSetBuildDb, characterDb, weaponDb } = await getDb();
  const characters = await characterModel.find();
  const characterIds = map(characters, ({ _id }) => _id);
  const characterBuildAbyssStats: any = groupById(
    flatten(
      await Promise.all(
        flattenDeep(map(characterIds, (charId) => abyssBattleService.getCharacterBuildAbyssStats(charId))),
      ),
    ),
    'characterId',
  );
  console.log('Done character build stats');

  // const characterBuildData: any = {};
  // forEach(characterBuilds, (builds, characterId) => {
  //   characterBuildData[characterId] = {
  //     constellations: map(
  //       orderBy(characterConstellationCounts[characterId][0].constellations, 'constellation', 'asc'),
  //       (c) => c.count,
  //     ),
  //     builds: map(values(builds), (build) => omit(build, 'characterId')),
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
  //     builds: map(values(stats), (stat) => omit(stat, 'characterId')),
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

  const weaponCounts = await playerCharacterService.getWeaponCounts();
  console.log('Done weapon abyss stats');

  forEach(weaponCounts, ({ weaponId, count }) => {
    const weaponCharacters: { characterId: string; count: number }[] = [];
    forEach(characterBuildAbyssStats, (buildStat) => {
      const { weapons, characterId } = buildStat;
      console.log(buildStat);
      const weaponStat = find(weapons, (weapon) => weapon.weaponId.toString() === weaponId.toString());

      if (weaponStat) {
        const charIdx = findIndex(
          weaponCharacters,
          (char) => char.characterId.toString() === characterId.toString(),
        );

        if (charIdx > -1) {
          weaponCharacters[charIdx].count += weaponStat.battleCount;
        } else {
          weaponCharacters.push({
            characterId,
            count: weaponStat.battleCount,
          });
        }
      }
    });
  });
})();
