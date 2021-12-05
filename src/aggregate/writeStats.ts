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
  intersection,
  isEqual,
  map,
  orderBy,
  range,
  some,
  uniqWith,
} from 'lodash';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import { getDb } from './writeDb';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);
const characterService = new CharacterService(characterModel);

type TeamStat = {
  party: string[];
  floorLevel?: string;
  battleIndex?: number;
  battleCount: number;
  winCount: number;
  avgStar: number;
};

type Flex = { charId: string; battleCount: number };

const compareParties = (src, other) => {
  let compareFloors = true;
  if (src.floorLevel && src.battleIndex) {
    compareFloors = src.floorLevel === other.floorLevel && src.battleIndex === other.battleIndex;
  }

  return isEqual(src.party, other.party) && compareFloors;
};

const aggregateCoreTeams = (parties: TeamStat[]) => {
  const partyIndexes = [0, 1, 2, 3];
  const allIndexes = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];

  let coreTeams: {
    coreParty: string[];
    battleCount: number;
    winCount: number;
    avgStar: number;
    flex: Flex[][];
  }[] = [];

  forEach(parties, ({ party, battleCount, winCount, avgStar }) => {
    forEach(allIndexes, (coreIndexes) => {
      const coreParty = [party[coreIndexes[0]], party[coreIndexes[1]], party[coreIndexes[2]]].sort();
      const partyIdx = findIndex(coreTeams, (team) => {
        return (
          isEqual(team.coreParty, coreParty) &&
          intersection(map(team.flex[0], (flex) => flex.charId)).length > 0
        );
      });
      const flexIdx = difference(partyIndexes, coreIndexes)[0];

      if (partyIdx > -1) {
        coreTeams[partyIdx].battleCount += battleCount;
        coreTeams[partyIdx].winCount += winCount;
        coreTeams[partyIdx].avgStar =
          (coreTeams[partyIdx].avgStar * coreTeams[partyIdx].battleCount + avgStar * battleCount) /
          (coreTeams[partyIdx].battleCount + battleCount);
        const charIdx = findIndex(coreTeams[partyIdx].flex[0], (flex) => flex.charId === party[flexIdx]);

        if (charIdx > -1) {
          coreTeams[partyIdx].flex[0][charIdx].battleCount += battleCount;
        } else {
          coreTeams[partyIdx].flex[0].push({ charId: party[flexIdx], battleCount });
        }
      } else {
        coreTeams.push({
          coreParty: coreParty,
          battleCount,
          winCount,
          avgStar,
          flex: [[{ charId: party[flexIdx], battleCount }]],
        });
      }
    });
  });

  coreTeams = orderBy(coreTeams, 'battleCount', 'desc');
  coreTeams.forEach((team, i) => {
    team.flex[0] = orderBy(team.flex[0], 'battleCount', 'desc');
  });

  const combinedTeams = [];
  while (coreTeams.length) {
    const team1 = coreTeams[0];
    const compareTeams = cloneDeep(coreTeams.slice(1));
    const coreTeams2 = [];
    const prevCoreTeamsLen = coreTeams.length;

    let i = 0;
    while (i < compareTeams.length) {
      if (
        difference(
          [...compareTeams[i].coreParty, compareTeams[i].flex[0][0].charId],
          [...team1.coreParty, team1.flex[0][0].charId],
        ).length === 1
      ) {
        coreTeams2.push(compareTeams[i]);
        compareTeams.splice(i, 1);
      } else {
        i++;
      }
    }

    if (team1) combinedTeams.push(team1);

    if (prevCoreTeamsLen === compareTeams.length) {
      coreTeams = coreTeams.slice(1);
    } else {
      coreTeams = compareTeams;
    }
  }

  const threshold = 0.15;
  combinedTeams.forEach((team) => {
    // const flexTotal = getTotal(team.flex);

    team.flex[0] = orderBy(
      filter(team.flex[0], (flex) => {
        return flex.battleCount / team.battleCount >= threshold;
      }),
      'battleCount',
      'desc',
    );
  });

  const mergedTeams = [];
  combinedTeams.forEach((team) => {
    const teamIdx = findIndex(mergedTeams, (_team) => {
      if ((team.flex[0] && !team.flex[0].length) || (_team.flex[0] && !_team.flex[0].length)) return false;

      return isEqual(
        [...team.coreParty, team.flex[0][0].charId].sort(),
        [..._team.coreParty, _team.flex[0][0].charId].sort(),
      );
    });

    if (teamIdx > -1) {
      mergedTeams[teamIdx].flex.push(team.flex[0]);
      mergedTeams[teamIdx].battleCount += team.battleCount;
    } else {
      mergedTeams.push(team);
    }
  });

  return orderBy(mergedTeams, 'battleCount', 'desc');
};

export async function aggregateAll() {
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

  const allTopTeams = flatten(
    await Promise.all(
      flattenDeep(map(characterIds, (characterId) => abyssBattleService.getTopParties(characterId))),
    ),
  );

  const topTeams = aggregateCoreTeams(uniqWith(allTopTeams, compareParties));
  fs.writeFileSync('data/abyss/stats/top-abyss-teams.json', JSON.stringify(topTeams));

  console.log('Done top parties');

  const allFloorTeams = flatten(
    await Promise.all(
      flattenDeep(
        map(allCharFloors, ({ floor_level, battle_index, characterId }) =>
          abyssBattleService.getTopFloorParties(floor_level, battle_index, characterId),
        ),
      ),
    ),
  );

  const floorTeams = uniqWith(allFloorTeams, compareParties);
  const groupedFloorTeams = groupBy(floorTeams, 'floorLevel');
  const topFloorTeams = {};

  Object.entries(groupedFloorTeams).forEach((floorData) => {
    const data = floorData[1];
    const floorLevel = floorData[0];

    const groupedBattleTeams = groupBy(data, 'battleIndex');

    Object.entries(groupedBattleTeams).forEach((battleData) => {
      const teams = battleData[1];
      const battleIndex = battleData[0];

      topFloorTeams[floorLevel] = {};
      topFloorTeams[floorLevel][battleIndex] = aggregateCoreTeams(teams);
    });
  });

  for (const floorLevel of allFloors) {
    fs.writeFileSync(`data/abyss/${floorLevel}.json`, JSON.stringify(topFloorTeams[floorLevel]));
  }
  console.log('Done floor parties');

  const characterAbyssStats = flatten(
    await Promise.all(
      flattenDeep(
        map(characterIds, (characterId) => abyssBattleService.getCharacterAbyssStats(characterId)),
      ),
    ),
  );
  console.log('Done character abyss stats');

  const charBuilds = flatten(
    await Promise.all(
      flattenDeep(map(characterIds, (charId) => playerCharacterService.getCharacterBuilds(charId))),
    ),
  );

  const characterTotals = await playerCharacterService.getCharacterTotals();
  console.log('Done character totals');

  const characterData: any = [];
  map(charBuilds, ({ characterId, artifactSets, weapons }) => {
    const statIdx = findIndex(
      characterAbyssStats,
      (stat) => stat.characterId.toString() === characterId.toString(),
    );
    const totalIdx = findIndex(
      characterTotals,
      (total) => total.characterId.toString() === characterId.toString(),
    );

    if (statIdx > -1) {
      const { battleCount, winCount, avgStar } = characterAbyssStats[statIdx];

      characterData.push({
        _id: characterId,
        battleCount,
        winCount,
        avgStar,
        artifactSets,
        weapons,
        total: characterTotals[totalIdx] ? characterTotals[totalIdx].total : 0,
      });
    }
  });

  for (const data of characterData) {
    const idx = findIndex(
      characterDb,
      ({ _id }) => _id && data._id && _id.toString() === data._id.toString(),
    );

    if (idx > -1) {
      fs.writeFileSync(`data/characters/${data._id.toString()}.json`, JSON.stringify(data));
    }
  }
  console.log('Done character builds');

  const weaponAbyssStats = await abyssBattleService.getWeaponAbyssStats();
  console.log('Done weapon abyss stats');

  const weaponTotals = await playerCharacterService.getWeaponTotals();

  const weaponTypeTotals: { _id: string; total: number }[] =
    await playerCharacterService.getWeaponTypeTotals();
  fs.writeFileSync('data/weapons/stats/type-totals.json', JSON.stringify(weaponTypeTotals)),
    console.log('Done weapon totals');

  const weaponData: any = [];
  forEach(weaponTotals, ({ weaponId, total }) => {
    const statIdx = findIndex(
      weaponAbyssStats,
      (stat) => stat.weaponId && weaponId && stat.weaponId.toString() === weaponId.toString(),
    );

    if (statIdx > -1) {
      const { battleCount, winCount, avgStar } = weaponAbyssStats[statIdx];

      weaponData.push({
        _id: weaponId,
        total,
        battleCount,
        winCount,
        avgStar,
      });
    }
  });

  for (const data of weaponData) {
    const idx = findIndex(
      weaponDb,
      ({ _id }) => _id && data._id && _id.toString() === data._id.toString(),
    );

    if (idx > -1) {
      fs.writeFileSync(`data/weapons/${data._id.toString()}.json`, JSON.stringify(data));
    }
  }

  const artifactSetAbyssStats = await abyssBattleService.getArtifactSetAbyssStats();
  console.log('Done artifact set abyss stats');

  const artifactSetTotals = await playerCharacterService.getArtifactSetTotals();
  console.log('Done artifactset totals');

  const artifactSetData: any = [];
  forEach(artifactSetTotals, ({ artifactSetBuildId, artifactSets, total }) => {
    const statIdx = findIndex(
      artifactSetAbyssStats,
      (stat) =>
        stat.artifactSetBuildId &&
        artifactSetBuildId &&
        stat.artifactSetBuildId.toString() === artifactSetBuildId.toString(),
    );

    if (statIdx > -1) {
      const { battleCount, winCount, avgStar } = artifactSetAbyssStats[statIdx];

      artifactSetData.push({
        _id: artifactSetBuildId,
        artifactSets,
        total,
        battleCount,
        winCount,
        avgStar,
      });
    }p
  });

  for (const data of artifactSetDb) {
    const buildIds = map(
      filter(artifactSetBuildDb, ({ sets }) =>
        some(sets, (set) => data._id && set._id && data._id.toString() === set._id.toString()),
      ),
      (setBuild) => setBuild._id,
    );
    const allSetData = filter(
      map(buildIds, (buildId) =>
        find(artifactSetData, (set) => set._id.toString() === buildId.toString()),
      ),
      (data) => !!data,
    );

    const setData = {
      _id: data._id,
      sets: allSetData,
    };
    fs.writeFileSync(`data/artifactSets/${data._id.toString()}.json`, JSON.stringify(setData));
  }
}
