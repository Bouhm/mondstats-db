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

(async () => {
  await connectDb();
  const { artifactSetDb, artifactSetBuildDb, characterDb, weaponDb } = await getDb();
  const characters = await characterModel.find();
  const characterIds = map(characters, ({ _id }) => _id);
  function groupByCharacterId(obj: any) {
    return reduce(
      obj,
      (res, curr) => {
        res[curr.characterId] = res[curr.characterId] || [];
        res[curr.characterId].push(curr);
        return res;
      },
      {},
    );
  }

  const characterBuilds = groupByCharacterId(
    flatten(
      await Promise.all(
        flattenDeep(map(characterIds, (charId) => playerCharacterService.getCharacterBuilds(charId))),
      ),
    ),
  );

  console.log(values(characterBuilds));

  const characterConstellationCounts = groupBy(
    await playerCharacterService.getCharacterConstellationCount(),
    'characterId',
  );

  console.log(characterConstellationCounts[0]);
})();
