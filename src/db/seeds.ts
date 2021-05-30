'use strict';
import Axios from 'axios';
import fs from 'fs';
import https from 'https';
import _ from 'lodash';
import mongoose from 'mongoose';

import Artifact from '../models/artifact';
import Character from '../models/character';
import {
    IAbyssBattle, IAffix, IArtifact, IArtifactSet, ICharacter, ICharacterResponse, IPlayer,
    IPlayerCharacter, IWeapon
} from '../models/interfaces';
import Player from '../models/player';
import PlayerCharacter from '../models/playerCharacter';
import Weapon from '../models/weapon';
import connectDb from '../util/connection';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const DEVELOPMENT = true
const TEST = false
const isDryRun = (process.argv.slice(2)[0] === '--dry');
const testCharId = 10000003

const spiralAbyssApiUrl = 'https://api-os-takumi.mihoyo.com/game_record/genshin/api/spiralAbyss';
const userApiUrl = 'https://api-os-takumi.mihoyo.com/game_record/genshin/api/index'
const charApiUrl = 'https://bbs-api-os.hoyolab.com/game_record/genshin/api/character';
// const proxiesUrl = "https://raw.githubusercontent.com/scidam/proxy-list/master/proxy.json";

const axios = Axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const PROXIES: Array<{ ip: string, port: string }> = [];
let TOKENS: string[] = [];
let timeoutBox: string[] = [];
let proxyIdx = 0;
let accIdx = 0;
let iterationStart = Date.now();
const maxRest = (60 * 10 * 1000) / 30;
const maxLevel = 90;

let characterDb: ICharacter[] = [];
let weaponDb: IWeapon[] = [];
let artifactDb: IArtifact[] = [];
let playerDb: IPlayer[] = [];

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

    let restMs = _clamp(0, maxRest, Date.now() - iterationStart) + 1000;
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function _clamp(min: number, max: number, num: number) {
  return Math.min(Math.max(num, min), max);
}

const getHeaders = () => {
  proxyIdx = _clamp(0, PROXIES.length-1, proxyIdx);
  accIdx = _clamp(0, TOKENS.length-1, accIdx);

  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json;charset=utf-8',
    'x-rpc-app_version': '1.5.0',
    'x-rpc-language': 'en-us',
    'X-Forwarded-For': PROXIES[proxyIdx].ip,
    'X-Forwarded-Port': PROXIES[proxyIdx].port,
    'Origin': 'https://webstatic-sea.hoyolab.com',
    'DNT': '1',
    'DS': '1621631797,ckwx6Z,004f2c9a96e69364019a3bbaeac30905',
    'Connection': 'keep-alive',
    'Referer': 'https://webstatic-sea.hoyolab.com/',
    'Cookie': TOKENS[accIdx],
    'TE': 'Trailers'
  }
}

let validUids: number[] = [];
let playerAbyssData: IAbyssBattle[] = [];
const playerCharacters: ICharacter[] = [];
let playerTraveler = {
  id: 100,
  element: 'Anemo'
}

const chunkSize = 2000;
const server = 'asia';

const charactersPath = './src/db/characters.json'
const weaponsPath = './src/db/weapons.json'
const artifactsPath = './src/db/artifacts.json'
const uidsPath = `./src/db/${server}/uids.json`
const tokensPath = './src/keys/tokens.json'
const proxiesPath = './src/keys/proxies.json'
const getDataPath = (group: string) => `./${server}/${group}.json`
const getChunkPath = (chunkNum: number, server: string) => `./${server}/chunks/${chunkNum}.json`

function _getBaseUid(server: string, start = 0) {
  let uidBase = 100000000;

  switch (server) {
    case 'cn':
      uidBase *= 1;
      break;
    case 'asia':
      uidBase *= 8;
      break;
    case 'euro':
      uidBase *= 7;
      break;
    case 'usa':
      uidBase *= 6;
      break;
    default:
      uidBase *= 8;
      break;
  }

  return uidBase + start;
}

function _generateUids(start: number, count: number, servers: string[]) {
  return _.flatten(_.map(servers, (server) => {
    let uidBase = 100000000;

    switch (server) {
      case 'cn':
        uidBase *= 1;
        break;
      case 'asia':
        uidBase *= 8;
        break;
      case 'euro':
        uidBase *= 7;
        break;
      case 'usa':
        uidBase *= 6;
        break;
      default:
        uidBase *= 8;
        break;
    }

    return _.map(Array.from(Array(count).keys()), (num) => uidBase + start + num)
  }))
}

function _getServerFromUid(uid: number) {
  switch (('' + uid)[0]) {
    case '1':
      return 'cn';
    case '6':
      return 'usa';
    case '7':
      return 'euro';
    case '8':
      return 'asia';
    default:
      return 'usa';
  }
}

function _getActivationNumber(count: number, affixes: IAffix[]) {
  const activations = _.map(affixes, (effect) => effect.activation_number);

  let activation = 0;
  _.forEach(activations, (activation_num) => {
    if (count >= activation_num) {
      activation = activation_num as number;
    }
  })

  return activation;
}

const handleBlock = async (tokenIdx: number) => {
  if (tokenIdx > TOKENS.length - 1) {
    tokenIdx = 0;
    accIdx = 0;
  }

  if (TOKENS.length > 0) {
    timeoutBox.push(TOKENS.splice(tokenIdx, 1)[0]);
    accIdx--;
  }

  if (TOKENS.length === 0) {
    TOKENS = timeoutBox;
    timeoutBox = [];
    console.log('12 hour wait...')
    await _sleep(43200 * 1000);
  }
}

const assignTraveler = (charData: ICharacter) => {
  let id = 100;
  let element = 'Anemo'

  switch (charData.constellations[0].id) {
    // Anemo
    case 71:
      element = 'Anemo';
      id = 100;
      break;
    // Geo
    case 91:
      element = 'Geo';
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

function _areEqualShallow(a: any, b: any) {
  for(var key in a) {
      if(!(key in b) || a[key] !== b[key]) {
          return false;
      }
  }
  for(var key in b) {
      if(!(key in a) || a[key] !== b[key]) {
          return false;
      }
  }
  return true;
}

// Aggregate spiral abyss data
const getSpiralAbyssThreshold = async (server: string, uid: number, threshold = 8) => {
  const apiUrl = `${spiralAbyssApiUrl}?server=os_${server}&role_id=${uid}&schedule_type=1`;

  try {
    const resp = await axios.get(apiUrl, { headers: getHeaders(), withCredentials: true });

    // Rate limit reached message
    if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
      return null;
    }
    // if (resp.data && resp.data.message && DEVELOPMENT) console.log("First pass: " + resp.data.message);
    if (!resp.data || !resp.data.data) { return false; }

    const maxFloor = resp.data.data.max_floor;

    return (maxFloor.split('-')[0] >= threshold);
  } catch (error) {
    console.log(error);
    return false;
  }
}

// Get player's owned character ids
const getPlayerCharacters = async (server: string, uid: number, threshold = 40) => {
  const apiUrl = `${userApiUrl}?server=os_${server}&role_id=${uid}`

  return axios.get(apiUrl, { headers: getHeaders(), withCredentials: true })
    .then((resp) => {
      // Rate limit reached message
      if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
        return null
      }
      // if (resp.data && resp.data.message && DEVELOPMENT) console.log("Second pass: " + resp.data.message);
      if (!resp.data || !resp.data.data) { return []; }

      return _.map(_.filter(resp.data.data.avatars, (char) => char.level >= threshold), (char) => char.id)
    })
    .catch((error) => {
      console.log(error)
      return [];
    })
}

const aggregateCharacterData = async (char: ICharacterResponse) => {
  // Update database
  const options = { upsert: true, new: true, runValidators: true }

  // Weapons
  let charWeapon: IWeapon = _.pick(char.weapon, [
    'id','desc','name','rarity','type','type_name','icon'
  ])

  let weaponRef = await Weapon.findOneAndUpdate({ id: charWeapon.id }, {$setOnInsert: charWeapon}, options)

  let artifactRefs: IArtifact[] = [];
  // Artifacts
  _.forEach(char.reliquaries, async (artifact) => {
    let charArtifact: IArtifact = _.pick(artifact, [
      'id','name','rarity','icon','pos','pos_name','set'
    ])

    let artifactRef = await Artifact.findOneAndUpdate({ id: charArtifact.id }, {$setOnInsert: charArtifact}, options)
    artifactRefs.push(artifactRef)
  })

  // Characters
  let character: ICharacter = _.pick(char, [
    'constellations','element','id','name','rarity'
  ])

  let characterRef = await Character.findOneAndUpdate({ id: character.id }, {$setOnInsert: character}, options)

  // PlayerCharacters
  let cNum = 0;
  for (let i = 0; i < 6; i++) {
    if (char.constellations[i].is_actived) {
      cNum++;
    }
  }

  let playerCharacter: IPlayerCharacter = {
    character: characterRef,
    artifacts: artifactRefs,
    constellation: cNum,
    fetter: char.fetter,
    level: char.level,
    weapon: weaponRef
  }

  await PlayerCharacter.findOneAndUpdate(
    {character: playerCharacter}, 
    {$setOnInsert: playerCharacter},
    options
  )
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

          return charId
        }).sort()

        if (TEST && !partyIds.includes(testCharId)) return;

        let floorKey = (floor.index + '') as keyof IAbyssData;
        let levelKey = (level.index + '') as keyof IAbyssLevels;

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
        if (char.weapon.rarity >= 3 && !_.find(char.reliquaries, relic => relic.rarity <= 3)) {
          aggregateCharacterData(char);
        }
      })

      // Abyss data
      aggregateAbyssData(playerAbyssData);

      return true
    })
    .catch(error => {
      console.log(error)
    });
}

const aggregateAllCharacterData = async (startIdx = 0) => {
  let firstPass = false;

  let total = 99999999;
  let checkedValidUids = false;
  let i = startIdx
  let uid = _getBaseUid(server); 
  let blockedIdx = 0;

  while (i < total) {
    uid += i;
    // Convoluted way of going through valid UIDs first, then new ones
    // if (!checkedValidUids && i < startingUids.length - 1) {
    //   uid = startingUids[i]
    // } else {
    //   if (!checkedValidUids && startingUids.length > i) {
    //     checkedValidUids = true;
    //     i = 1;
    //   }
    //   uid = startingUid + i;
    // }

    // if (DEVELOPMENT) console.log(uid, i, dataNum);
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
          }
        }
        i++;
      }
    }
  }
}

// const loadFromJson = () => {
//   // COOKIES = _.shuffle(JSON.parse(fs.readFileSync(cookiesPath, 'utf-8')));
//   // PROXIES = _.shuffle(JSON.parse(fs.readFileSync(proxiesPath, 'utf-8')));
//   characterDb = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
//   weaponDb = JSON.parse(fs.readFileSync(weaponsPath, 'utf-8'));
//   artifactDb = JSON.parse(fs.readFileSync(artifactsPath, 'utf-8'));
//   validUids = JSON.parse(fs.readFileSync(uidsPath, 'utf-8'));
// }

// async function _seedFromJson() {
//   loadFromJson()

//   const characters: ICharacter[] = _.map(_.values(characterDb), (character) => {
//     const constellations = _.map(character.constellations, (constellation) => ({
//       id: constellation.id,
//       effect: constellation.effect,
//       name: constellation.name,
//       pos: constellation.pos,
//       icon: constellation.icon
//     }))

//     return {
//       id: character.id,
//       element: character.element,
//       icon: character.icon,
//       image: character.image,
//       name: character.name,
//       rarity: character.rarity,
//       constellations
//     }
//   })

//   const weapons: IWeapon[] = _.map(_.values(weaponDb), (weapon) => ({
//     id: weapon.id,
//     desc: weapon.desc,
//     name: weapon.name,
//     icon: weapon.icon,
//     type: weapon.type,
//     type_name: weapon.type_name,
//     rarity: weapon.rarity
//   }))

//   const artifactSets: IArtifactSet[] = []
//   _.forEach(_.values(artifactDb), (artifact) => {
//     const setIdx = _.findIndex(artifactSets, { id: artifact.set.id })

//     if (setIdx > -1) {
//       const set = artifactSets[setIdx];

//       if (artifact.rarity < set.rarity) return;

//       if (artifact.rarity > set.rarity) {
//         set.rarity = artifact.rarity;
//       }
    
//       if (!_.find(set.artifacts, { name: artifact.name })) {
//         set.artifacts.push(artifact);
//       }

//       set.artifacts = _.filter(set.artifacts, artifact => artifact.rarity === set.rarity)
//     } else {
//       artifactSets.push({
//         id: artifact.set.id,
//         rarity: artifact.rarity,
//         affixes: artifact.set.affixes,
//         name: artifact.set.name,
//         artifacts: [artifact]
//       })
//     }
//   })

//   await Promise.all([
//     Character.insertMany(characters),
//     Weapon.insertMany(weapons),
//     ArtifactSet.insertMany(artifactSets)
//   ]);
    
//   mongoose.connection.close();
// }

// Run functions

connectDb();
mongoose.connection.once('open', async () => {
  // aggregateAllCharacterData();
});
