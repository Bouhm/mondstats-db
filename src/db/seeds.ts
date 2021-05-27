"use strict";
import mongoose from 'mongoose';
import connectDb from '../util/connection';
import Axios from 'axios';
import fs from 'fs';
import fsAsync from 'fs/promises';
import https from 'https';
import _, { chunk } from 'lodash';

import {
    IAbyss, IAbyssData, IAbyssLevels, IAffix, IArtifactDb, IArtifactSet, ICharacter, ICharacterDb,
    ICharData, IChunkData, IData, IWeaponDb, newAbyss, newChunk
} from './types';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
const DEVELOPMENT = true
const TEST = false
const isDryRun = (process.argv.slice(2)[0] === "--dry");
const testCharId = 10000003

const spiralAbyssApiUrl = "https://api-os-takumi.mihoyo.com/game_record/genshin/api/spiralAbyss";
const userApiUrl = "https://api-os-takumi.mihoyo.com/game_record/genshin/api/index"
const charApiUrl = "https://bbs-api-os.hoyolab.com/game_record/genshin/api/character";
// const proxiesUrl = "https://raw.githubusercontent.com/scidam/proxy-list/master/proxy.json";
// const getProxies = async () => {
//   await axios.get(proxiesUrl).then(res => PROXIES = _.shuffle(_.map(res.data.proxies, proxy => ({ ip: proxy.ip, port: proxy.port }))))
// }

const axios = Axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

let PROXIES: { ip: string, port: string }[] = [];
let TOKENS: string[] = [];
let timeoutBox: string[] = [];
let proxyIdx = 0;
let accIdx = 0;
let iterationStart = Date.now();
const maxRest = (60 * 10 * 1000) / 30;
const maxLevel = 90;

const _incrementAccIdx = async () => {
  accIdx++
  _incrementProxyIdx()

  if (accIdx > TOKENS.length - 1) {
    accIdx = 0

    if (proxyIdx + TOKENS.length > PROXIES.length - 1) {
      proxyIdx = 0;
    } else {
      proxyIdx += TOKENS.length;
    }

    // Clamp
    let restMs = Math.min(Math.max(maxRest - (Date.now() - iterationStart), 0), maxRest) + 1000;
    iterationStart = Date.now();
    await _sleep(restMs);
  }

  // if (DEVELOPMENT) console.log("using next acc... " + accIdx);
}

const _incrementProxyIdx = () => {
  proxyIdx++
  if (proxyIdx >= PROXIES.length) {
    proxyIdx = 0
  }

  // if (DEVELOPMENT) console.log("using next proxy... " + proxyIdx);
}

async function _sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getHeaders = () => ({
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Content-Type": "application/json;charset=utf-8",
  "x-rpc-app_version": "1.5.0",
  "x-rpc-language": "en-us",
  "X-Forwarded-For": PROXIES[proxyIdx].ip,
  "X-Forwarded-Port": PROXIES[proxyIdx].port,
  "Origin": "https://webstatic-sea.hoyolab.com",
  "DNT": "1",
  "DS": "1621631797,ckwx6Z,004f2c9a96e69364019a3bbaeac30905",
  "Connection": "keep-alive",
  "Referer": "https://webstatic-sea.hoyolab.com/",
  "Cookie": TOKENS[accIdx],
  "TE": "Trailers"
});

let validUids: number[] = [];
let characterDb: ICharacterDb = {};
let weaponDb: IWeaponDb = {};
let artifactDb: IArtifactDb = {};
let chunkData: IChunkData = newChunk;
let playerAbyssData: IAbyss = { floors: [] };
let abyssClearers: Set<number> = new Set();
let playerTraveler = {
  id: 100,
  element: "Anemo"
}
let dataKeys = new Set(["all"]);

const chunkSize = 2000;
const server = "asia";

const dataGroups = ["mains", "abyssClears", "all"]
const charactersPath = "./db/characters.json"
const weaponsPath = "./db/weapons.json"
const artifactsPath = "./db/artifacts.json"
const uidsPath = `./db/${server}/uids.json`
const tokensPath = "../keys/tokens.json"
const proxiesPath = "../keys/proxies.json"
const getChunksDir = `./db/${server}/chunks`
const getDataPath = (group: string) => `./db/${server}/${group}.json`
const getChunkPath = (chunkNum: number, server: string) => `./db/${server}/chunks/${chunkNum}.json`

function _getBaseUid(server: string, start: number) {
  let uidBase = 100000000;

  switch (server) {
    case "cn":
      uidBase *= 1;
      break;
    case "asia":
      uidBase *= 8;
      break;
    case "euro":
      uidBase *= 7;
      break;
    case "usa":
      uidBase *= 6;
      break;
    default:
      uidBase *= 8;
      break;
  }

  return uidBase + start;
}

function _generateUids(start: number, count: number, servers: string[]) {
  return _.flatten(_.map(servers, server => {
    let uidBase = 100000000;

    switch (server) {
      case "cn":
        uidBase *= 1;
        break;
      case "asia":
        uidBase *= 8;
        break;
      case "euro":
        uidBase *= 7;
        break;
      case "usa":
        uidBase *= 6;
        break;
      default:
        uidBase *= 8;
        break;
    }

    return _.map(Array.from(Array(count).keys()), num => uidBase + start + num)
  }))
}

function _getServerFromUid(uid: number) {
  switch (('' + uid)[0]) {
    case '1':
      return "cn";
    case '6':
      return "usa";
    case '7':
      return "euro";
    case '8':
      return "asia";
    default:
      return "usa";
  }
}

const loadFromDatabases = () => {
  TOKENS = _.shuffle(JSON.parse(fs.readFileSync(tokensPath, 'utf-8')));
  PROXIES = _.shuffle(JSON.parse(fs.readFileSync(proxiesPath, 'utf-8')));
  characterDb = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
  weaponDb = JSON.parse(fs.readFileSync(weaponsPath, 'utf-8'));
  artifactDb = JSON.parse(fs.readFileSync(artifactsPath, 'utf-8'));
  validUids = JSON.parse(fs.readFileSync(uidsPath, 'utf-8'));
}

const writeToDatabases = (chunk: number, server: string) => {
  return [
    fsAsync.writeFile(charactersPath, JSON.stringify(characterDb)),
    fsAsync.writeFile(weaponsPath, JSON.stringify(weaponDb)),
    fsAsync.writeFile(artifactsPath, JSON.stringify(artifactDb)),
    fsAsync.writeFile(uidsPath, JSON.stringify(validUids)),
    fsAsync.writeFile(getChunkPath(chunk, server), JSON.stringify(chunkData)),
  ]
}

function _mergeCharData(src: { [id: string]: ICharData }, charData: ICharData, charId: string) {
  if (src[charId]) {
    src[charId] = charData;
  } else {
    let allChar = src[charId]

    // Constellations
    allChar.constellations = _.mergeWith(allChar.constellations, charData.constellations, (v1, v2) => v1 + v2);

    // Levels
    allChar.avgLevel = Math.floor((allChar.avgLevel + charData.avgLevel) / 2);

    // Totals
    allChar.total += charData.total;

    // Builds
    _.forEach(charData.builds, build => {
      let setIdx = _.findIndex(allChar.builds, ({ artifacts }) => _.isEqual(artifacts, build.artifacts))
      if (setIdx > -1) {
        let totalBuild = allChar.builds[setIdx];

        // Weapons
        _.forEach(build.weapons, weapon => {
          let wepIdx = _.findIndex(totalBuild.weapons, ({ id: weapon.id }))

          if (wepIdx > -1) {
            totalBuild.weapons[wepIdx].count += weapon.count
          } else {
            totalBuild.weapons.push(weapon)
          }
        })

        // Artifact Sets count
        totalBuild.count += build.count
      } else {
        allChar.builds.push(build)
      }
    })
  }
} 

function _mergeAbyssData(src: IAbyssData, floor: IAbyssLevels, floorNum: string) {
  _.forIn(floor, (stage, stageNum) => {
    _.forEach(stage, (battle, half) => {  
      src[floorNum][stageNum][half].total += battle.total;

      _.forEach(battle.teams, (team) => {
        let partyIdx = _.findIndex(src[floorNum][stageNum][half].teams, { party: team.party })

        if (partyIdx > -1) {
          src[floorNum][stageNum][half].teams[partyIdx].count += team.count
        } else {
          src[floorNum][stageNum][half].teams.push(team)
        }
      })
    })
  })
}

const mergeChunkData = () => {
  let chunks: IChunkData[] = [];

  fs.readdirSync(getChunksDir).forEach(fileName => {
    if (fileName.endsWith('.json')) {
      let chunkPath = `./db/${server}/chunks/${fileName}`;
      chunks.push(JSON.parse(fs.readFileSync(chunkPath, 'utf-8')));
    }
  })

  let groupData = chunks.splice(0, 1).pop();

  return Promise.all(
    _.map(dataGroups, key => { 
      _.forEach(chunks, chunk => {
        _.forIn(chunk[key as keyof IChunkData].characters, (chunkChar, charId) => {
          let allCharacters = groupData![key as keyof IChunkData].characters! || {};
          _mergeCharData(allCharacters, chunkChar, charId)
        })
          
        _.forIn(chunk[key as keyof IChunkData].abyss, (floor, floorNum) => {
          let allAbyss = groupData![key as keyof IChunkData].abyss!;
          _mergeAbyssData(allAbyss, floor, floorNum);
        })
      })

      if (key === "all") {
        _weedOut(groupData![key as keyof IChunkData]);
      }

      return fsAsync.writeFile(getDataPath(key), JSON.stringify(groupData![key as keyof IChunkData]))
    })
  );
}

// const mergeAllData = () => {
//   let mains = JSON.parse(fs.readFileSync(getDataPath("mains"), 'utf-8'));
//   let abyssClears = JSON.parse(fs.readFileSync(getDataPath("abyssClears"), 'utf-8'));
//   let allData = JSON.parse(fs.readFileSync(getDataPath("all"), 'utf-8'));

//   _.forEach([mains, abyssClears], group => {
//     _.forIn(group.characters, (char, charId) => {
//       _mergeCharData(allData, char, charId)
//     })
      
//     _.forIn(group.abyss, (floor, floorNum) => {
//       _mergeAbyssData(allData.abyss, floor, floorNum);
//     })
//   })

//   _weedOut(allData);
//   return fsAsync.writeFile(getDataPath("all"), JSON.stringify(allData));
// }

const _weedOut = async (data: IData) => {
  if (!data) return;
  const threshold = 0.05

  // Remove any builds below a threshold 
  _.forEach(data.characters, charData => {
    let filteredBuilds = _.filter(charData.builds, build => (build.count / charData.total) > threshold)
    charData.builds = filteredBuilds

    // Filter out weapons
    _.forEach(charData.builds, build => {
      build.weapons = _.filter(build.weapons, weapon => (weapon.count / build.count) > threshold)
    })
  })

  // Filter out abyss party
  _.forEach(data.abyss, (floor) => {
    _.forEach(floor, (stage) => {
      _.forEach(stage, (battle) => {        
        _.forEach(battle.teams, (team, i) => {
          if (team && (team.count / battle.total) < threshold) {
            battle.teams.splice(i, 1)
          }
        })
      })
    })
  })
}

const _updateChunk = async (dataNum: number) => {
  console.log("updating chunk...")
  let chunk = Math.ceil(dataNum / chunkSize);
  await Promise.all(writeToDatabases(chunk, server))
  await mergeChunkData()
  console.log("pushing up database updates...")

  chunkData = newChunk;
}

function _cleanArtifactData(artifact: any) {
  let newArti = _.clone(artifact);
  delete newArti.level;
  return newArti;
}

function _cleanWeaponData(weapon: any) {
  let newWeap = _.clone(weapon);
  delete newWeap.level;
  delete newWeap.affix_level;
  delete newWeap.promote_level;
  return newWeap;
}

function _cleanCharacterData(char: any) {
  let newChar = _.clone(char);
  if (char.id === 10000005 || char.id === 10000007) {
    assignTraveler(newChar)
  }
  delete newChar.weapon;
  delete newChar.reliquaries;
  delete newChar.fetter;
  delete newChar.level;
  _.forEach(newChar.constellations, cons => delete cons.is_actived);
  return newChar;
}

function _getActivationNumber(count: number, affixes: IAffix[]) {
  let activations = _.map(affixes, effect => effect.activation_number);

  let activation = 0;
  _.forEach(activations, activation_num => {
    if (count >= activation_num) {
      activation = activation_num;
    }
  })

  return activation;
}

const handleBlock = async(tokenIdx: number) => {
  if (tokenIdx > TOKENS.length - 1) {
    tokenIdx = 0;
    accIdx = 0;
  }

  if (TOKENS.length > 0) {
    timeoutBox.push(TOKENS.splice(tokenIdx, 1)[0]);
    console.log(TOKENS.length, timeoutBox.length)
  }

  if (TOKENS.length === 0) {
    TOKENS = timeoutBox;
    timeoutBox = [];
    console.log("12 hour wait...")
    await _sleep(43200*1000);
  }
}

const assignTraveler = (charData: ICharacter) => {
  let id = 100;
  let element = "Anemo"

  switch(charData.constellations[0].id) {
    // Anemo
    case 71:
      element = "Anemo";
      id = 100;
      break;
    // Geo
    case 91:
      element = "Geo";
      id =  101;
      break;
    default:
      break;
  }

  charData.id = id;
  charData.element = element;
  playerTraveler = {
    id, element
  }
}

// Aggregate spiral abyss data
const getSpiralAbyssThreshold = async (server: string, uid: number, threshold = 8) => {
  const apiUrl = `${spiralAbyssApiUrl}?server=os_${server}&role_id=${uid}&schedule_type=1`;

  try {
    const resp = await axios.get(apiUrl, { headers: getHeaders(), withCredentials: true });

    // Rate limit reached message
    if (resp.data && resp.data.message && resp.data.message.startsWith("Y")) {
      return null;
    }
    // if (resp.data && resp.data.message && DEVELOPMENT) console.log("First pass: " + resp.data.message);
    if (!resp.data || !resp.data.data) return false;

    let maxFloor = resp.data.data["max_floor"];

    if (maxFloor.split("-")[0] >= threshold) {
      if (maxFloor === "12-3" && resp.data.data["total_star"] >= 33) {
        dataKeys.add("abyssClears")
      }
      playerAbyssData = resp.data.data;
      return true
    } else {
      return false
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

// Get player's owned character ids
const getPlayerCharacters = async (server: string, uid: number, threshold = 40) => {
  const apiUrl = `${userApiUrl}?server=os_${server}&role_id=${uid}`

  return axios.get(apiUrl, { headers: getHeaders(), withCredentials: true })
    .then(resp => {
      // Rate limit reached message
      if (resp.data && resp.data.message && resp.data.message.startsWith("Y")) {
        return null
      }
      // if (resp.data && resp.data.message && DEVELOPMENT) console.log("Second pass: " + resp.data.message);
      if (!resp.data || !resp.data.data) return [];

      return _.map(_.filter(resp.data.data.avatars, char => char.level >= threshold), char => char.id)
    })
    .catch((error) => {
      console.log(error)
      return [];
    })
}

const aggregateCharacterData = (char: ICharacter) => {
  // Update database
  let wepDat = _cleanWeaponData(char.weapon);
  weaponDb[char.weapon.id] = wepDat;

  let artifactSets: IArtifactSet = {};
  _.forEach(char.reliquaries, relic => {
    let artiDat = _cleanArtifactData(relic);
    artifactDb[relic.id] = artiDat;

    if (artifactSets.hasOwnProperty(artiDat.set.id)) {
      artifactSets[artiDat.set.id].count++
    } else {
      artifactSets[artiDat.set.id] = {
        count: 1,
        affixes: artiDat.set.affixes
      }
    }
  });

  let buildIdNum = -1;
  let artifactSetCombinations: { id: number, activation_number: number }[] = [];

  _.forIn(artifactSets, (setData, id) => {
    let activationNum = _getActivationNumber(setData.count, setData.affixes);
    buildIdNum += parseInt(id) * activationNum;

    if (activationNum > 0) {
      artifactSetCombinations.push({
        id: parseInt(id),
        activation_number: activationNum
      })
    }
  });
  
  // Skip incomplete builds
  if (buildIdNum < 1 || !artifactSetCombinations.length || (artifactSetCombinations.length === 1 && artifactSetCombinations[0].activation_number < 4)) return;

  if (char.level === maxLevel) {
    dataKeys.add("mains")
  } 

  let constellations = new Array(7).fill(0);
  let cNum = 0;
  for (let i = 0; i < 6; i++) {
    if (char.constellations[i].is_actived) {
      cNum++;
    }
  }
  constellations[cNum] = 1;

  // This should be at the top of character data
  let charDat = _cleanCharacterData(char)
  characterDb[charDat.id] = charDat;

  _.forEach([...dataKeys], key => {
    let data = chunkData[key as keyof IChunkData];
    if (key === "abyssClears" && !abyssClearers.has(charDat.id)) return;

    if (data.characters[charDat.id]) {
      data.characters[charDat.id].constellations[cNum]++;
    
      const buildIdx = _.findIndex(data.characters[charDat.id].builds, { buildId: buildIdNum.toString() })
      if (buildIdx < 0) {
        data.characters[charDat.id].builds.push({
          buildId: buildIdNum.toString(),
          weapons: [{ id: char.weapon.id, count: 1 }],
          artifacts: artifactSetCombinations,
          count: 1
        })
      } else {
        // Update weapons
        const weaponIdx = _.findIndex(data.characters[charDat.id].builds[buildIdx].weapons, { id: char.weapon.id })
        if (weaponIdx < 0) {
          data.characters[charDat.id].builds[buildIdx].weapons.push({ id: char.weapon.id, count: 1 })
        } else {
          data.characters[charDat.id].builds[buildIdx].weapons[weaponIdx].count++;
        }
  
        // Update artifact set count
        data.characters[charDat.id].builds[buildIdx].count++;
      }
  
      data.characters[charDat.id].total++;
      data.characters[charDat.id].avgLevel = Math.floor(
        (data.characters[charDat.id].avgLevel * data.characters[charDat.id].total + char.level) / (data.characters[charDat.id].total)
      );
    } else {
      data.characters[charDat.id] = {
        id: charDat.id,
        name: charDat.name,
        constellations,
        avgLevel: char.level,
        builds: [{
          buildId: buildIdNum.toString(),
          weapons: [{ id: char.weapon.id, count: 1 }],
          artifacts: artifactSetCombinations,
          count: 1
        }],
        total: 1
      }
    }
  })
}

const aggregateAbyssData = (abyssData: IAbyss) => {
  _.forEach(_.filter(abyssData.floors, floor => floor.index > 8), floor => {
    _.forEach(_.filter(floor.levels, level => level.star > 0), level => {
      _.forEach(level.battles, battle => {
        const partyIds: number[] = _.map(battle.avatars, char => {
          let charId = char.id;
          if (char.id === 10000005 || char.id === 10000007) {
            charId = playerTraveler.id
          }

          if (dataKeys.has("abyssClears")) abyssClearers.add(charId)

          return charId
        }).sort()

        if (TEST && !partyIds.includes(testCharId)) return;

        let floorKey = (floor.index + '') as keyof IAbyssData;
        let levelKey = (level.index + '') as keyof IAbyssLevels;

        _.forEach([...dataKeys], key => {
          let data = chunkData[key as keyof IChunkData];

          if (!_.isEmpty(data.abyss)) {
            if (!data.abyss[floorKey][levelKey][battle.index-1].teams) {
              data.abyss[floorKey][levelKey][battle.index-1] =
                { teams: [{ party: partyIds, count: 1 }], total: 1 }
            } else {
              let levelData = data.abyss[floorKey][levelKey][battle.index-1];
              let partyIdx = _.findIndex(levelData.teams, { party: partyIds })

              if (partyIdx > -1) {
                levelData.teams[partyIdx].count++
              } else {
                levelData.teams.push({
                  party: partyIds,
                  count: 1
                })
              }
              levelData.total++;
            }
          } else {
            data.abyss = newAbyss;
            data.abyss[floorKey][levelKey][battle.index-1] =
              { teams: [{ party: partyIds, count: 1 }], total: 1 }
          }
        })
      })
    })
  })
}

const aggregatePlayerData = async (server: string, uid: number, characterIds: number[]) => {
  let reqBody = {
    "character_ids": characterIds,
    "server": `os_${server}`,
    "role_id": uid
  }

  return axios.post(charApiUrl, reqBody, { headers: getHeaders(), withCredentials: true })
    .then(resp => {
      // Rate limit reached message
      if (resp.data && resp.data.message && resp.data.message.startsWith("Y")) {
        return null
      }
      // if (resp.data && resp.data.message && DEVELOPMENT) console.log("Third pass : " + resp.data.message);
      if (!resp.data || !resp.data.data) return false;

      _.forEach(resp.data.data.avatars, char => {
        if (dataKeys.has("mains")) dataKeys.delete("mains");
        if (char.weapon.rarity >= 3 && !_.find(char.reliquaries, relic => relic.rarity <= 3)) {
          if (TEST && testCharId !== char.id) return;
          aggregateCharacterData(char);
        }
      })

      // Abyss data
      aggregateAbyssData(playerAbyssData);

      // Increment totals
      _.forEach([...dataKeys], key => chunkData[key as keyof IChunkData].totalPlayers++ )
      return true
    })
    .catch(error => {
      console.log(error)
    });
}

const aggregateAllCharacterData = async (startingUids: number[], startIdx = 0) => {
  let firstPass = false;
  let dataNum = startIdx;
  let startingUid = startingUids[startingUids.length-1];
  let total = 50000000;
  let checkedValidUids = false;
  let i = startIdx
  let blockedIdx = 0;

  while (i < total) {
    dataKeys.clear()
    dataKeys.add("all")

    // Convoluted way of going through valid UIDs first, then new ones
    let uid = 0;
    if (!checkedValidUids && i < startingUids.length - 1) {
      uid = startingUids[i]
    } else {
      if (!checkedValidUids && startingUids.length > i) {
        checkedValidUids = true;
        i = 1;
      }
      uid = startingUid + i;
    } 

    if (DEVELOPMENT) console.log(uid, i, dataNum);
    // const server = _getServerFromUid(uid);

    let shouldCollectData: boolean | null = firstPass;
    if (!firstPass) {
      shouldCollectData = await getSpiralAbyssThreshold(server, uid)
      blockedIdx = accIdx;
      await _incrementAccIdx();
    }
    
    // Blocked
    if (shouldCollectData === null) {
      await handleBlock(blockedIdx)
      if (DEVELOPMENT) console.log(timeoutBox.length + " blocked at " + i);

      continue;
    } 
    if (!shouldCollectData) {
      i++;
      continue;
    }

    if (shouldCollectData) {
      if (!validUids.includes(uid)) validUids.push(uid);
      firstPass = true;

      const characterIds = await getPlayerCharacters(server, uid)
      blockedIdx = accIdx;
      await _incrementAccIdx();

      if (characterIds === null) {
        await handleBlock(blockedIdx)
        if (DEVELOPMENT) console.log(timeoutBox.length + " blocked at " + i);
        continue;
      } else {
        if (characterIds.length > 0) {
          const result = await aggregatePlayerData(server, uid, characterIds)
          blockedIdx = accIdx;
          await _incrementAccIdx();
          
          if (result === null) {
            await handleBlock(blockedIdx)
            if (DEVELOPMENT) console.log(timeoutBox.length + " blocked at " + i);
            continue;
          } else {
            firstPass = false;
            dataNum++;

            if (dataNum % chunkSize === 0) {
              await _updateChunk(dataNum)
            }
          }
        }
        i++;
      }
    }
  }

  if (DEVELOPMENT) {
    console.log("Out loop", i, dataNum)
  }
  await _updateChunk(dataNum)
}

(async () => {
  // const start = 0;
  // const count = 10000000;
  // const servers = ["usa"];
  // let uids = _generateUids(start, count, servers);
  const start = 0;

  loadFromDatabases();
  // let baseUid = _getBaseUid(server, start)
  // const startIdx = _.(validUids, indexOf())

  if (isDryRun) {
    const charData = JSON.parse(fs.readFileSync('./db/sampleChars.json', 'utf-8'));
    const abyssData = JSON.parse(fs.readFileSync('./db/sampleAbyss.json', 'utf-8'));
    _.forEach(charData.data.avatars, char => aggregateCharacterData(char))
    aggregateAbyssData(abyssData)
    fs.writeFileSync('./db/sample.json', JSON.stringify(chunkData))
  } else {
    aggregateAllCharacterData(validUids)
  }
})()


// connectDb();

// mongoose.connection.once('open', () => {

// });

