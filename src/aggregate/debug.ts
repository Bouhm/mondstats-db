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

  const allFloors = [];

  forEach(range(9, 13), (floor) => {
    forEach(range(1, 4), (stage) => {
      allFloors.push(`${floor}-${stage}`);
    });
  });

  const allCharFloors = [];

  forEach(range(9, 13), (floor) => {
    forEach(range(1, 4), (stage) => {
      forEach(range(1, 3), (battle) => {
        forEach(characterIds, (charId) => {
          allCharFloors.push({
            floor_level: `${floor}-${stage}`,
            battle_index: battle,
            characterId: charId,
          });
        });
      });
    });
  });

  // const allTopTeams = flatten(
  //   await Promise.all(
  //     flattenDeep(map(characterIds, (characterId) => abyssBattleService.getTopParties(characterId))),
  //   ),
  // );

  // const topTeams = aggregateCoreTeams(uniqWith(allTopTeams, compareParties));
  // fs.writeFileSync('data/abyss/stats/top-abyss-teams.json', JSON.stringify(topTeams));

  // console.log('Done top parties');

  const allFloorTeams = flatten(
    await Promise.all(
      flattenDeep(
        map(allCharFloors, ({ floor_level, battle_index, characterId }) =>
          abyssBattleService.getTopFloorParties(floor_level, battle_index, characterId),
        ),
      ),
    ),
  );

  const groupedFloorTeams = groupBy(allFloorTeams, 'floorLevel');
  const topFloorTeams = {};
  console.log(groupedFloorTeams)


  Object.entries(groupedFloorTeams).forEach((floorData) => {
    const data = uniqWith(floorData[1], compareParties);
    const floorLevel = floorData[0];

    const groupedBattleTeams = groupBy(data, 'battleIndex');
    console.log(groupedBattleTeams);
  });
})();
