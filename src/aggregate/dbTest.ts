import {
  cloneDeep,
  difference,
  filter,
  findIndex,
  flatten,
  flattenDeep,
  forEach,
  groupBy,
  intersection,
  isEqual,
  map,
  omit,
  orderBy,
  range,
  reduce,
  uniqWith,
} from 'lodash';
import mongoose from 'mongoose';

import abyssBattleModel from '../abyss-battle/abyss-battle.model';
import { AbyssBattleService } from '../abyss-battle/abyss-battle.service';
import characterModel from '../character/character.model';
import { CharacterService } from '../character/character.service';
import playerCharacterModel from '../player-character/player-character.model';
import { PlayerCharacterService } from '../player-character/player-character.service';
import connectDb from '../util/connection';

const abyssBattleService = new AbyssBattleService(abyssBattleModel);
const playerCharacterService = new PlayerCharacterService(playerCharacterModel);
const characterService = new CharacterService(characterModel);

(async () => {
  await connectDb();

  // abyssBattleModel.createIndexes([{ floor_level: 1, battle_index: 1 }], { sparse: true });

  try {
    const characters = await characterService.list();
    const characterIds = map(characters, ({ _id }) => _id);
    const allFloors = [];

    forEach(range(9, 13), (floor) => {
      forEach(range(1, 4), (stage) => {
        forEach(range(1, 3), (battle) => {
          // forEach(characterIds, (charId) => {
          allFloors.push({
            floorLevel: `${floor}-${stage}`,
            battleIndex: battle,
            // characterIds: [charId],
          });
          // });
        });
      });
    });

    const compareParties = (src, other) => isEqual(src.party, other.party) && src.battle === other.battle;

    const floorTeams = uniqWith(
      flatten(
        await Promise.all(
          flattenDeep(
            map(allFloors, (floor) => {
              const { floorLevel, battleIndex } = floor;

              return map(characterIds, (charId) =>
                abyssBattleService.getTopFloorParties(floorLevel, battleIndex, [charId]),
              );
            }),
          ),
        ),
      ),
      compareParties,
    );

    const topTeams = orderBy(
      reduce(
        floorTeams,
        (combined, curr) => {
          const partyIdx = findIndex(combined, ({ party }) => isEqual(party, curr.party));
          const newCombined = combined;
          const newCurr = omit(curr, 'battle');

          if (partyIdx < 0) {
            newCombined.push(newCurr);
          }

          return newCombined;
        },
        [],
      ),
      'count',
      'desc',
    );

    console.log('Done character floor teams');

    const allTopTeams = aggregateCoreTeams(topTeams);
    const allFloorTeams = {};

    forEach(groupBy(allFloorTeams, 'battle'), (battleData: TeamStat[], floorLevel: string) => {
      allFloorTeams[floorLevel] = aggregateCoreTeams(orderBy(battleData, 'count', 'desc'));
    });

    console.log('Done merging teams');

    await Promise.all([
      // fs.writeFile('data/weapons/stats/top-weapons.json', JSON.stringify(topWeaponStats), (e) => e),
      // fs.writeFile('data/weapons/stats/weapon-totals.json', JSON.stringify(weaponStatsTotals), (e) => e),
      // ...map(weaponStats, (weaponStat) => {
      //   const weapon = find(weaponDb, { _id: weaponStat._id });
      //   if (!weapon) return;
      //   const fileName = getShortName(weapon);
      //   return fs.writeFile(`data/weapons/${fileName}.json`, JSON.stringify(weaponStat), (e) => e);
      // }),
      // fs.writeFile(
      //   'data/artifacts/stats/top-artifactsets.json',
      //   JSON.stringify(topArtifactSetStats),
      //   (e) => e,
      // ),
      // fs.writeFile(
      //   'data/artifacts/stats/artifactset-totals.json',
      //   JSON.stringify(artifactSetStatsTotals),
      //   (e) => e,
      // ),
      // ...map(artifactSetStats, (artifactSetStat) => {
      //   const artifactSets = filter(artifactSetDb, (artifactSet) =>
      //     includes(
      //       map(artifactSetStat.artifacts, (set) => set._id),
      //       artifactSet._id,
      //     ),
      //   );
      //   const fileName = map(
      //     artifactSets,
      //     (artifactSet, i) =>
      //       `${artifactSetStat.artifacts[i].activation_number}${getShortName(artifactSet)}`,
      //   ).join('-');
      //   return fs.writeFile(`data/artifacts/${fileName}.json`, JSON.stringify(artifactSetStat), (e) => e);
      // }),
      // fs.writeFile('data/characters/stats/top-characters.json', JSON.stringify(topCharacterStats), (e) => e),
      // // fs.writeFile(
      // //   'data/characters/stats/character-totals.json',
      // //   JSON.stringify(characterStatsTotals),
      // //   (e) => e,
      // // ),
      // ...map(characterBuilds, (charBuild) => {
      //   const character = find(characterDb, { _id: charBuild.char_id });
      //   const fileName = getShortName(character);
      //   return fs.writeFile(`data/characters/${fileName}.json`, JSON.stringify(charBuild), (e) => e);
      // }),
      // ...map(mainCharacterBuilds, (charBuild) => {
      //   const character = find(characterDb, { _id: charBuild.char_id });
      //   const fileName = getShortName(character);
      //   return fs.writeFile(`data/characters/mains/${fileName}.json`, JSON.stringify(charBuild), (e) => e);
      // }),
      // fs.writeFile('data/abyss/stats/top-abyss-teams.json', JSON.stringify(allTopTeams), (e) => e),
      // ...map(allFloorTeams, (teamData, )) => {
      //   return fs.writeFile(`data/abyss/${floorLevel}-${battleIndex}.json`, JSON.stringify({}), (e) => e);
      // }),
    ]);
  } catch (err) {
    console.log(err);
  }

  await mongoose.connection.close();
})();

type TeamStat = {
  party: string[];
  battle?: string;
  count: number;
  winCount: number;
  avgStar: number;
};

type Flex = { charId: string; count: number };

const aggregateCoreTeams = (parties: TeamStat[]) => {
  const partyIndexes = [0, 1, 2, 3];
  const allIndexes = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];

  let coreTeams: { coreParty: string[]; count: number; flex: Flex[][] }[] = [];

  forEach(parties, ({ party, count }) => {
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
        coreTeams[partyIdx].count += count;
        const charIdx = findIndex(coreTeams[partyIdx].flex[0], (flex) => flex.charId === party[flexIdx]);

        if (charIdx > -1) {
          coreTeams[partyIdx].flex[0][charIdx].count += count;
        } else {
          coreTeams[partyIdx].flex[0].push({ charId: party[flexIdx], count });
        }
      } else {
        coreTeams.push({
          coreParty: coreParty,
          count,
          flex: [[{ charId: party[flexIdx], count }]],
        });
      }
    });
  });

  coreTeams = orderBy(coreTeams, 'count', 'desc');
  coreTeams.forEach((team, i) => {
    team.flex[0] = orderBy(team.flex[0], 'count', 'desc');
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
        return flex.count / team.count >= threshold;
      }),
      'count',
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
      mergedTeams[teamIdx].count += team.count;
    } else {
      mergedTeams.push(team);
    }
  });

  return orderBy(mergedTeams, 'count', 'desc');
};
