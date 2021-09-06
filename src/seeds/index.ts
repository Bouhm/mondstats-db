'use strict';
import Axios from 'axios';
import fs from 'fs';
import https from 'https';
import { clamp, filter, find, forEach, forIn, map, pick, shuffle, some } from 'lodash';
import mongoose, { Schema } from 'mongoose';
import { firefox } from 'playwright-firefox';
import parallel from 'run-parallel';

import AbyssBattleModel from '../abyss-battle/abyss-battle.model';
import ArtifactSetModel from '../artifact-set/artifact-set.model';
import ArtifactModel from '../artifact/artifact.model';
import CharacterModel from '../character/character.model';
import PlayerCharacterModel from '../player-character/player-character.model';
import PlayerModel, { PlayerDocument } from '../player/player.model';
import TokenModel from '../token/token.model';
import connectDb from '../util/connection';
import WeaponModel from '../weapon/weapon.model';
// import { updateDb } from './aggregate';
import { IAbyssResponse, IArtifactSet, ICharacterResponse } from './interfaces';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const spiralAbyssApiUrl = 'https://api-os-takumi.mihoyo.com/game_record/genshin/api/spiralAbyss';
const userApiUrl = 'https://api-os-takumi.mihoyo.com/game_record/genshin/api/index';
const charApiUrl = 'https://api-os-takumi.mihoyo.com/game_record/genshin/api/character';

const axios = Axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

// const tokensPath = './src/keys/tokens.json';
const proxiesPath = './src/keys/proxies.json';
// const dsPath = './src/keys/DS.json';

let PROXIES: Array<{ ip: string; port: string }> = [];
// let TOKENS: string[] = [];
let Cookie = '';
let DS = '';
// let blockedIndices: boolean[] = [];
let proxyIdx = 0;
let uid = 0;
const iterationStart = Date.now();
let areAllStillBlocked = true;
let abyssSchedule = 1;
const blockedLevel = 0;
const dayMs = 24 * 60 * 60 * 1000;
const maxRest = dayMs / 30;
const lastPatchCycle = new Date(Date.now() - 6 * 7 * dayMs);
const delayMs = 200;
let dailyUpdate;
let weeklyUpdate;
let collectedTotal = 0;
let playerRef: PlayerDocument;
let playerCharRefMap: { [oid: string]: any } = {};
let playerAbyssData: IAbyssResponse;
let concurrent = 1;
let existingUids = false;
let maxUid = 0;

const options = {
  upsert: true,
  new: true,
  runValidators: true,
  useFindAndModify: false,
};

function getNextMonday(date: Date) {
  const day = date.getDay() || 7;
  if (day !== 1) date.setHours(-24 * (day - 1)) + 7 * dayMs;
  return new Date(date).setUTCHours(23, 59, 59, 999);
}

function getNextDay(date: Date) {
  date.setHours(24);
  return new Date(date).setUTCHours(23, 59, 59, 999);
}

const assignTravelerOid = (charData: ICharacterResponse) => {
  let oid = 100;

  switch (charData.element) {
    case 'Anemo':
      oid = 100;
      break;
    case 'Geo':
      oid = 101;
      break;
    case 'Electro':
      oid = 102;
      break;
    case 'Cr2o':
      oid = 103;
      break;
    case 'Hydro':
      oid = 104;
      break;
    case 'Dendro':
      oid = 105;
      break;
    case 'Pyro':
      oid = 106;
      break;
    default:
      break;
  }

  return oid;
};

const nextToken = async () => {
  const token = await TokenModel.findOne().sort({ used: 1 }).limit(1).lean();
  Cookie = `ltoken=${token.ltoken}; ltuid=${token.ltuid}`;
  _incrementProxyIdx();

  if (token.used) {
    const delta = new Date().getTime() - new Date(token.used).getTime();

    if (delta < maxRest) {
      const restMs = clamp(maxRest - delta, 0, maxRest) + delayMs;
      await _sleep(restMs);
    }
  }

  const updatedToken = await TokenModel.findOneAndUpdate(
    { ltuid: token.ltuid },
    { used: new Date() },
    options,
  );
  // if (DEVELOPMENT) console.log("using next token... " + tokenIdx);
};

const _incrementProxyIdx = () => {
  proxyIdx++;
  if (proxyIdx >= PROXIES.length) {
    proxyIdx = 0;
  }

  // if (DEVELOPMENT) console.log("using next proxy... " + proxyIdx);
};

async function _sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _retry(promiseFactory, retryCount) {
  try {
    return await promiseFactory();
  } catch (error) {
    if (retryCount <= 0) {
      throw error;
    }
    return await _retry(promiseFactory, retryCount - 1);
  }
}

// Grab DS
const updateDS = async () => {
  // const cookieTokens = TOKENS[tokenIdx].split(' ');
  // const ltoken = cookieTokens[0].split('=')[1].slice(0, -1);
  // const ltuid = cookieTokens[1].split('=')[1];

  const browser = await firefox.launch();
  const context = await browser.newContext({
    extraHTTPHeaders: {
      Cookie: Cookie,
      'x-rpc-client_type': '4',
      'x-rpc-app_version': '1.5.0',
    },
  });

  // context.addCookies([
  //   { name: 'ltoken', value: ltoken, domain: '.hoyolab.com', path: '/' },
  //   { name: 'ltuid', value: ltuid, domain: '.hoyolab.com', path: '/'  },
  // ]);

  const page = await context.newPage();

  return new Promise<void>(async (resolve) => {
    page.on('request', (req) => {
      if (req.headers().ds) {
        DS = req.headers().ds;
        resolve();
        browser.close();
      }
    });

    const url = 'https://www.hoyolab.com/genshin/accountCenter/gameRecord?id=63548220';
    await _retry(() => page.goto(url), 3);
  });
};

const getHeaders = () => {
  proxyIdx = clamp(proxyIdx, 0, PROXIES.length - 1);

  return {
    Host: 'api-os-takumi.mihoyo.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'x-rpc-client_type': '4',
    'x-rpc-app_version': '1.5.0',
    'x-rpc-language': 'en-us',
    DS,
    Origin: 'https://webstatic-sea.hoyolab.com',
    DNT: '1',
    Connection: 'keep-alive',
    Referer: 'https://webstatic-sea.hoyolab.com/',
    Cookie,
    TE: 'Trailers',
    'X-Forwarded-For': PROXIES[proxyIdx].ip,
    'X-Forwarded-Port': PROXIES[proxyIdx].port,
  };
};

const server = 'usa';

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

const handleBlock = async () => {
  // blockedIndices[tokenIdx] = true;
  // console.log(`${filter(blockedIndices, (blocked) => blocked).length}/${blockedIndices.length}`);

  // if (filter(blockedIndices, (blocked) => blocked).length >= TOKENS.length) {
  //   console.log('--- ALL BLOCKED ---');
  //   // if (areAllStillBlocked) {
  //   //   blockedLevel++;

  //   //   if (blockedLevel > longRests.length - 1) {
  //   //     blockedLevel = longRests.length - 1;
  //   //   }
  //   // } else {
  //   //   blockedLevel = 0;
  //   // }

  //   console.log('Long rest...');
  //   await _sleep(dayMs);
  //   blockedIndices = new Array(TOKENS.length).fill(false);
  // }
  console.log(`Blocked at ${Cookie.split(' ')[1]}`);
  await _sleep(maxRest);
};

const purgePlayer = async (uid: number) => {
  const oldPlayers = await PlayerModel.findOne({ uid }).lean();

  await Promise.all(
    map(oldPlayers, (player) => {
      return Promise.all([
        PlayerModel.deleteOne({ _id: player._id }),
        AbyssBattleModel.deleteMany({ player: player._id }),
        PlayerCharacterModel.deleteMany({ player: player._id }),
      ]);
    }),
  );
};

const purgeOld = async () => {
  await PlayerCharacterModel.deleteMany({
    updatedAt: { $lt: lastPatchCycle },
  });
  await AbyssBattleModel.deleteMany({ updatedAt: { $lt: lastPatchCycle } });
};

// Aggregate spiral abyss data
const getSpiralAbyssData = async (server: string, currUid: number, scheduleType = 1, threshold = 9) => {
  const apiUrl = `${spiralAbyssApiUrl}?server=os_${server}&role_id=${currUid}&schedule_type=${scheduleType}`;

  try {
    const resp = await axios.get(apiUrl, {
      headers: getHeaders(),
      withCredentials: true,
    });

    // Rate limit reached message
    if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
      // console.log('Abyss data: ', resp.data.message);
      return null;
    }
    if (resp.data && resp.data.message && resp.data.message.startsWith('invalid')) {
      // console.log('Abyss data: ', resp.data.message);
      return undefined;
    }
    if (resp.data && resp.data.message && resp.data.message.startsWith('Data')) {
      if (existingUids) purgePlayer(currUid);
      return false;
    }
    if (!resp.data || !resp.data.data) {
      return false;
    }

    const maxFloor = resp.data.data.max_floor;

    if (maxFloor.split('-')[0] >= threshold) {
      playerAbyssData = resp.data.data;
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Get player's owned character ids
const getPlayerCharacters = async (server: string, currUid: number) => {
  const apiUrl = `${userApiUrl}?server=os_${server}&role_id=${currUid}`;

  return axios
    .get(apiUrl, { headers: getHeaders(), withCredentials: true })
    .then(async (resp) => {
      // Rate limit reached message
      if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
        // console.log('Character list data: ', resp.data.message);
        return null;
      }
      if (resp.data && resp.data.message && resp.data.message.startsWith('invalid')) {
        // console.log('Abyss data: ', resp.data.message);
        return undefined;
      }
      if (!resp.data || !resp.data.data) {
        return [];
      }

      return map(resp.data.data.avatars, (char) => char.id);
    })
    .catch((error) => {
      console.log(error);
      return [];
    });
};

function _getActivationNumber(count: number, affixes: any[]) {
  const activations: number[] = affixes.map((effect) => effect.activation_number);

  let activation = 0;
  forEach(activations, (activation_num) => {
    if (count >= activation_num) {
      activation = activation_num;
    }
  });

  return activation;
}

const aggregateCharacterData = async (char: ICharacterResponse) => {
  // Characters
  const character = {
    oid: char.id,
    ...pick(char, ['element', 'name', 'rarity', 'icon', 'image']),
    constellations: map(char.constellations, (constellation) => {
      return {
        oid: constellation.id,
        icon: constellation.icon,
        name: constellation.name,
        effect: constellation.effect,
        pos: constellation.pos,
        weapon_type: char.weapon.type,
      };
    }),
  };

  if (character.name === 'Traveler') {
    character.oid = assignTravelerOid(char);
  }

  // map(character.constellations, constellation => {
  //   delete constellation.is_actived
  // })

  const characterRef = await CharacterModel.findOneAndUpdate(
    { oid: character.oid, element: character.element },
    { $setOnInsert: character },
    options,
  );

  // Weapons
  const charWeapon = {
    oid: char.weapon.id,
    ...pick(char.weapon, ['desc', 'name', 'rarity', 'level', 'affix_level', 'type', 'type_name', 'icon']),
  };

  const weaponRef = await WeaponModel.findOneAndUpdate(
    { oid: charWeapon.oid },
    { $setOnInsert: charWeapon },
    options,
  );

  const artifactSets: IArtifactSet = {};
  forEach(char.reliquaries, (relic) => {
    if (artifactSets.hasOwnProperty(relic.set.id)) {
      artifactSets[relic.set.id].count++;
    } else {
      artifactSets[relic.set.id] = {
        count: 1,
        affixes: relic.set.affixes,
      };
    }
  });

  // Artifacts
  const artifactSetCombinations: { id: number; activation_number: number }[] = [];
  const artifactRefIds: Schema.Types.ObjectId[] = [];

  for (const artifact of char.reliquaries) {
    const charArtifact = {
      oid: artifact.id,
      ...pick(artifact, ['name', 'rarity', 'icon', 'pos', 'pos_name']),
      set: {
        oid: artifact.set.id,
        affixes: artifact.set.affixes,
        name: artifact.set.name,
      },
    };

    const artifactSetRef = await ArtifactSetModel.findOneAndUpdate(
      { oid: artifact.set.id },
      { $setOnInsert: artifact.set },
      options,
    );
    charArtifact.set = artifactSetRef._id;

    const artifactRef = await ArtifactModel.findOneAndUpdate(
      { oid: charArtifact.oid },
      { $setOnInsert: charArtifact },
      options,
    );
    artifactRefIds.push(artifactRef._id);
  }

  forIn(artifactSets, (setData, id) => {
    const activationNum = _getActivationNumber(setData.count, setData.affixes);
    if (activationNum > 0) {
      artifactSetCombinations.push({
        id: parseInt(id),
        activation_number: activationNum,
      });
    }
  });

  // Skip incomplete builds
  if (
    char.level >= 40 &&
    (!artifactSetCombinations.length ||
      (artifactSetCombinations.length === 1 && artifactSetCombinations[0].activation_number < 4))
  )
    return;

  if (artifactRefIds.length === 5) {
    // PlayerCharacters
    let cNum = 0;
    for (let i = 0; i < 6; i++) {
      if (char.constellations[i].is_actived) {
        cNum++;
      }
    }

    const playerCharacter: any = {
      character: characterRef._id,
      artifacts: artifactRefIds,
      constellation: cNum,
      fetter: char.fetter,
      level: char.level,
      weapon: weaponRef._id,
      player: playerRef._id,
    };

    if (playerAbyssData.damage_rank.length && playerAbyssData.damage_rank[0].avatar_id === character.oid) {
      playerCharacter.strongest_strike = playerAbyssData.damage_rank[0].value;
    }

    const playerCharacterRef = await PlayerCharacterModel.findOneAndUpdate(
      { character: characterRef._id, player: playerRef._id },
      { $setOnInsert: playerCharacter },
      options,
    );
    playerCharRefMap[character.oid] = playerCharacterRef._id;
  }
};

const aggregateAbyssData = (abyssData: IAbyssResponse) => {
  forEach(
    filter(abyssData.floors, (floor) => floor.index > 8),
    (floor) => {
      forEach(
        filter(floor.levels, (level) => level.star > 2),
        (level) => {
          forEach(level.battles, (battle) => {
            const abyssBattle = {
              floor_level: `${floor.index}-${level.index}`,
              battle_index: battle.index,
              player: playerRef._id,
              party: map(battle.avatars, (char) => playerCharRefMap[char.id]),
            };

            if (
              some(abyssBattle.party, (char) => char === null || char === undefined) ||
              abyssBattle.party.length < 4
            )
              return;

            AbyssBattleModel.findOneAndUpdate(
              {
                floor_level: `${floor.index}-${level.index}`,
                battle_index: battle.index,
                player: playerRef._id,
              },
              { $setOnInsert: abyssBattle },
              options,
            )
          });
        },
      );
    },
  );
};

const aggregatePlayerData = async (server: string, curruid: number, characterIds: number[]) => {
  const reqBody = {
    character_ids: characterIds,
    server: `os_${server}`,
    role_id: curruid,
  };

  return axios
    .post(charApiUrl, reqBody, { headers: getHeaders(), withCredentials: true })
    .then(async (resp) => {
      // Rate limit reached message
      if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
        // console.log('Player characters data: ', resp.data.message);
        return null;
      }
      if (resp.data && resp.data.message && resp.data.message.startsWith('invalid')) {
        // console.log('Abyss data: ', resp.data.message);
        return undefined;
      }
      if (!resp.data || !resp.data.data) return false;

      await Promise.all(
        map(resp.data.data.avatars, async (char) => {
          if (
            char.weapon.rarity >= 3 &&
            char.reliquaries.length === 5 &&
            !find(char.reliquaries, (relic) => relic.rarity <= 3)
          ) {
            return aggregateCharacterData(char);
          }
        }),
      );

      // Abyss data
      aggregateAbyssData(playerAbyssData);

      return true;
    })
    .catch((error) => {
      console.log(error);
    });
};

const aggregatePlayerGameData = async (isMainProcess = false, initUid = 0) => {
  const baseUid = _getBaseUid(server);
  const end = baseUid + 99999999;
  // let currTokenIdx = 0;
  uid = !!initUid ? initUid : baseUid;
  let currUid = uid;

  while (uid < end) {
    if (existingUids && uid < maxUid) {
      if (!(await PlayerModel.findOne({ uid }).lean())) {
        uid++;
        continue;
      }
    }

    currUid = uid;

    playerCharRefMap = {};
    areAllStillBlocked = true;
    // const now = new Date();

    try {
      const shouldCollectData = await getSpiralAbyssData(server, currUid, abyssSchedule);

      // Blocked
      if (shouldCollectData === null) {
        // currTokenIdx = tokenIdx;
        await nextToken();
        await handleBlock();
        continue;
      } else if (shouldCollectData === undefined) {
        await updateDS();
        continue;
      }
      areAllStillBlocked = false;

      if (!shouldCollectData) {
        uid++;
        continue;
      }

      if (shouldCollectData) {
        console.log(`Collecting data for player ${currUid}...`);
        // currTokenIdx = tokenIdx;
        await nextToken();

        try {
          playerRef = await PlayerModel.findOneAndUpdate(
            { uid: currUid },
            {
              uid: currUid,
              total_star: playerAbyssData.total_star,
              total_battles: playerAbyssData.total_battle_times,
              total_wins: playerAbyssData.total_win_times,
              schedule_id: playerAbyssData.schedule_id,
            },
            options,
          );

          let characterIds = [];

          // Every week we check for new characters
          // if (now.getTime() > weeklyUpdate) {
          //   weeklyUpdate = getNextMonday(now);

          //   characterIds = await getPlayerCharacters(server, currUid);
          // currTokenIdx = tokenIdx;
          //   await nextToken();

          //   // Otherwise we skip the API call
          // } else {
          // const playerCharacters = await PlayerCharacterModel.find({ player: playerRef._id })
          //   .lean()
          //   .populate({ path: 'character', select: 'oid -_id' });

          // if (playerCharacters && playerCharacters.length > 0 && !includes(playerCharacters, undefined)) {
          //   characterIds = map(playerCharacters, ({ character }: any) => character.oid);
          // } else {
          characterIds = await getPlayerCharacters(server, currUid);
          // currTokenIdx = tokenIdx;
          await nextToken();
          // }
          // }

          if (characterIds === null) {
            await handleBlock();
            continue;
          } else if (characterIds === undefined) {
            await updateDS();
            continue;
          } else {
            areAllStillBlocked = false;
            if (characterIds.length > 0) {
              const result = await aggregatePlayerData(server, currUid, characterIds);
              // currTokenIdx = tokenIdx;
              await nextToken();

              if (result === null) {
                await handleBlock();
                continue;
              } else if (result === undefined) {
                await updateDS();
                continue;
              } else {
                areAllStillBlocked = false;
                collectedTotal++;
                console.log('Total: ', collectedTotal);
              }
            }
            uid++;
          }
        } catch (err) {
          console.log(err);
        } finally {
          // if (isMainProcess && now.getTime() > dailyUpdate) {
          //   console.log('DB UPDATE START');
          //   dailyUpdate = getNextDay(now);
          //   updateDb();
          // }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  console.log('Exit loop');
};

// let sampleChars: { data: { avatarss: ICharacterResponse[] } };
// let sampleAbyss: { data: IAbyssResponse };

const loadFromJson = () => {
  // TOKENS = shuffle(JSON.parse(fs.readFileSync(tokensPath, 'utf-8')));
  PROXIES = shuffle(JSON.parse(fs.readFileSync(proxiesPath, 'utf-8')));
  // DS = shuffle(JSON.parse(fs.readFileSync(dsPath, 'utf-8')));
  // sampleChars = JSON.parse(fs.readFileSync('./src/db/sampleChars.json', 'utf-8'));
  // sampleAbyss = JSON.parse(fs.readFileSync('./src/db/sampleAbyss.json', 'utf-8'));
};

const runParallel = async (func: (iMP: boolean) => void) => {
  const funcs = Array(concurrent).fill(func);

  // First process is main process
  funcs[0] = () => func(true);

  await new Promise(() => {
    parallel(funcs);
  });
};

// Run functions
connectDb();
mongoose.connection.once('open', async () => {
  try {
    // await purgeOld();

    const token = await TokenModel.findOne().sort({ used: 1 }).limit(1).lean();
    Cookie = `ltoken=${token.ltoken}; ltuid=${token.ltuid}`;

    loadFromJson();
    // blockedIndices = new Array(TOKENS.length).fill(false);
    await updateDS();
    const now = new Date();
    dailyUpdate = getNextDay(now);
    weeklyUpdate = getNextMonday(now);

    concurrent = parseInt(process.env.npm_config_concurrent);
    const baseUid = _getBaseUid(server);

    switch (process.env.npm_config_abyss) {
      case 'prev':
        console.log('Using last abyss data...');
        abyssSchedule = 2;
        break;
      default:
      case 'current':
        console.log('Using current abyss data...');
        abyssSchedule = 1;
        break;
    }

    if (parseInt(process.env.npm_config_uid)) {
      console.log('Starting from ' + process.env.npm_config_uid);
      await runParallel(
        async (isMainProcess: boolean) =>
          await aggregatePlayerGameData(isMainProcess, parseInt(process.env.npm_config_uid)),
      );
    } else {
      switch (process.env.npm_config_uid) {
        default:
        case 'last': {
          console.log('Starting after last UID...');
          const lastPlayer = await PlayerModel.findOne({ uid: { $gt: baseUid, $lt: baseUid + 99999999 } })
            .sort({ uid: -1 })
            .limit(1)
            .lean();
          await runParallel(
            async (isMainProcess = false) =>
              await aggregatePlayerGameData(isMainProcess, lastPlayer.uid + 1),
          );
          break;
        }
        case 'resume': {
          console.log('Starting after last upated UID...');
          const lastUpdatedPlayer = await PlayerModel.findOne({
            uid: { $gt: baseUid, $lt: baseUid + 99999999 },
          })
            .limit(1)
            .sort({ $natural: -1 })
            .lean();
          await runParallel(
            async (isMainProcess = false) =>
              await aggregatePlayerGameData(isMainProcess, lastUpdatedPlayer.uid + 1),
          );
          break;
        }
        case 'all':
          console.log('Starting from base UID...');
          await runParallel(async (isMainProcess = false) => await aggregatePlayerGameData(isMainProcess));
          break;
        case 'existing': {
          existingUids = true;
          console.log('Updating existing UIDs...');
          const oldestUpdatedPlayer = await PlayerModel.findOne({
            uid: { $gt: baseUid, $lt: baseUid + 99999999 },
          })
            .sort({ updatedAt: -1 })
            .limit(1)
            .lean();
          maxUid = (
            await PlayerModel.findOne({ uid: { $gt: baseUid, $lt: baseUid + 99999999 } })
              .sort({ uid: -1 })
              .limit(1)
              .lean()
          ).uid;
          await runParallel(
            async (isMainProcess = false) =>
              await aggregatePlayerGameData(isMainProcess, oldestUpdatedPlayer.uid + 1),
          );
          break;
        }
      }
    }
  } finally {
    await mongoose.connection.close();
  }
});
