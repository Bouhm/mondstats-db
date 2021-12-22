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
  uniq,
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
import weaponModel from '../weapon/weapon.model';
import { getDb } from './writeDb';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);

function groupById(obj: any, field = '_id') {
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

const compareParties = (src, other) => {
  let compareFloors = true;
  if (src.floorLevel && src.battleIndex) {
    compareFloors = src.floorLevel === other.floorLevel && src.battleIndex === other.battleIndex;
  }

  return isEqual(src.party, other.party) && compareFloors;
};

(async () => {
  await connectDb();
  const { artifactSetDb, artifactSetBuildDb, characterDb, weaponDb } = await getDb();
  const characters = await characterModel.find();
  const characterIds = map(characters, ({ _id }) => _id);

  const weaponCounts = await playerCharacterService.getWeaponCounts();
  const weaponAbyssStats: any = groupById(await abyssBattleService.getWeaponAbyssStats());
  console.log('Done weapon abyss stats');

  const weaponTypeTotals: any = await playerCharacterService.getWeaponTypeTotals();
  const weaponTypeAbyssTotals: any = await abyssBattleService.getWeaponTypeAbyssTotals();

  const topWeapons = [];
  forEach(weaponCounts, (weaponCount) => {
    const weaponCharacters: { _id: string; count: number }[] = [];
    // forEach(characterBuildAbyssStats, (buildStats) => {
    //   forEach(buildStats, ({ weapons }) => {
    //     const weaponStat = find(weapons, (weapon) => weapon._id.toString() === weaponCount._id.toString());

    //     if (weaponStat) {
    //       const charIdx = findIndex(
    //         weaponCharacters,
    //         (char) => char._id.toString() === weaponCount._id.toString(),
    //       );

    //       if (charIdx > -1) {
    //         weaponCharacters[charIdx].count += weaponStat.count;
    //       } else {
    //         weaponCharacters.push({
    //           _id: weaponCount._id,
    //           count: weaponStat.count,
    //         });
    //       }
    //     }
    //   });
    // });

    if (weaponAbyssStats[weaponCount._id]) {
      // const { winCount, avgStar } = weaponAbyssStats[weaponCount._id][0];
      const weapon = find(weaponDb, (weapon) => weapon._id.toString() == weaponCount._id.toString());

      if (!weapon) return;

      const typeTotal = find(
        weaponTypeTotals,
        (typeCount) => typeCount.weaponType === weapon.type_name,
      ).total;

      const typeAbyssTotal = find(
        weaponTypeAbyssTotals,
        (typeCount) => typeCount.weaponType === weapon.type_name,
      ).total;

      const weaponData = {
        _id: weaponCount._id,
        count: weaponCount.count,
        typeTotal,
        abyssCount: weaponAbyssStats[weaponCount._id][0].count,
        abyssTypeTotal: typeAbyssTotal,
        characters: orderBy(weaponCharacters, 'count', 'desc'),
      };

      topWeapons.push({
        _id: weaponCount._id,
        count: weaponCount.count,
        typeTotal,
        abyssCount: weaponAbyssStats[weaponCount._id][0].count,
        abyssTypeTotal: typeAbyssTotal,
      });
      // fs.writeFileSync(`data/weapons/${weaponCount._id.toString()}.json`, JSON.stringify(weaponData));
    }
  });

  console.log(topWeapon);

  fs.writeFileSync(
    `data/weapons/stats/top-weapons.json`,
    JSON.stringify(orderBy(topWeapons, 'count', 'desc')),
  );
})();
