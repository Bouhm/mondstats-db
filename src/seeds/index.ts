'use strict';
import Axios from 'axios';
import fs from 'fs';
import https from 'https';
import { clamp, every, filter, forEach, forIn, map, pick, shuffle, some } from 'lodash';
import md5 from 'md5';
import mongoose, { Schema } from 'mongoose';
import parallel from 'run-parallel';

import AbyssBattleModel from '../abyss-battle/abyss-battle.model';
import ArtifactSetModel from '../artifact-set/artifact-set.model';
import ArtifactModel from '../artifact/artifact.model';
import CharacterModel from '../character/character.model';
import PlayerCharacterModel from '../player-character/player-character.model';
import PlayerModel, { PlayerDocument } from '../player/player.model';
import TokenModel, { TokenDocument } from '../token/token.model';
import connectDb from '../util/connection';
import WeaponModel from '../weapon/weapon.model';
// import { updateDb } from './fetch';
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
let currRefs: {
  token: TokenDocument;
  DS: string;
  playerRef: PlayerDocument;
  playerCharRefMap: { [oid: string]: any };
  playerAbyssData: IAbyssResponse;
}[];
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
let concurrent = 1;
let existingUids = false;
let lastUpdatedUid = 0;
let currSkip = 0;

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
    case 'Cryo':
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

const handleResponse = (
  resp: { data: any; message: string; retcode: number },
  notOk: () => any,
  ok: () => any,
) => {
  if (!resp) {
    return notOk();
  }

  switch (resp.retcode) {
    case 10101: // Rate limit reached (30 per day)
    case -100: // Incorrect login cookies
    case 10001: // Incorrect login cookies
    case 10103: // Cookies correct but not bound to account
      return null;
    case -10001: // Invalid request (DS)
      console.log(resp.message, resp.retcode);
      return undefined;
    case 0:
      return ok();
    case 10102: // Data not public
    case 1009: // Could not find user with UID
    case -1: // Could not find user with UID
    default:
      return notOk();
  }
};

const nextToken = async (i: number, skip = false) => {
  const newToken = await TokenModel.findOne()
    .sort({ used: 1 })
    .skip(skip ? i : 0)
    .limit(1)
    .lean();
  currRefs[i].token = { ...currRefs[i].token, ...newToken } as unknown as TokenDocument & { DS: string };
  _incrementProxyIdx();

  if (currRefs[i].token.used) {
    const delta = new Date().getTime() - new Date(currRefs[i].token.used).getTime();

    if (delta < maxRest) {
      const restMs = clamp(maxRest - delta, 0, maxRest) + delayMs;
      await _sleep(restMs);
    }
  }

  await TokenModel.findOneAndUpdate({ ltuid: currRefs[i].token.ltuid }, { used: new Date() }, options);

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
const updateDS = async (i: number) => {
  // const cookieTokens = TOKENS[tokenIdx].split(' ');
  // const ltoken = cookieTokens[0].split('=')[1].slice(0, -1);
  // const ltuid = cookieTokens[1].split('=')[1];

  // const browser = await firefox.launch();
  // const Cookie = `ltoken=${currRefs[i].token.ltoken}; ltuid=${currRefs[i].token.ltuid}; mi18nLang=en-us; _MHYUUID=${currRefs[i].token._MHYUUID}`;
  // const context = await browser.newContext({
  //   extraHTTPHeaders: {
  //     Cookie,
  //     'x-rpc-client_type': '4',
  //     'x-rpc-app_version': '1.5.0',
  //   },
  // });

  // const page = await context.newPage();

  // return new Promise<void>(async (resolve) => {
  //   page.on('request', (req) => {
  //     if (req.headers().ds) {
  //       currRefs[i].DS = req.headers().ds;
  //       resolve();
  //       browser.close();
  //     }
  //   });

  //   const url = 'https://www.hoyolab.com/accountCenter/postList?id=59349680';
  //   await _retry(() => page.goto(url), 3);
  // });

  const randomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  // From Mimee on discord
  // const DS_SALT = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs';
  const DS_SALT = '6s25p5ox5y14umn1p61aqyyvbvvl3lrt';
  const randomStr = randomString(6);
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = md5(`salt=${DS_SALT}&t=${timestamp}&r=${randomStr}`);

  currRefs[i].DS = `${timestamp},${randomStr},${sign}`;
};

const getHeaders = (i: number) => {
  proxyIdx = clamp(proxyIdx, 0, PROXIES.length - 1);
  const Cookie = `ltoken=${currRefs[i].token.ltoken}; ltuid=${currRefs[i].token.ltuid}; mi18nLang=en-us; _MHYUUID=${currRefs[i].token._MHYUUID}`;

  return {
    Host: 'api-os-takumi.mihoyo.com',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'x-rpc-app_version': '1.5.0',
    'x-rpc-client_type': '5',
    'x-rpc-language': 'en-us',
    DS: currRefs[i].DS,
    Origin: 'https://webstatic-sea.hoyolab.com',
    DNT: '1',
    Connection: 'keep-alive',
    Referer: 'https://webstatic-sea.hoyolab.com/',
    Cookie,
    TE: 'trailers',
    'X-Forwarded-For': PROXIES[proxyIdx].ip,
    'X-Forwarded-Port': PROXIES[proxyIdx].port,
  };
};

let server = 'usa';

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

const handleBlock = async (i: number) => {
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
  console.log(`Blocked at ${currRefs[i].token.ltuid}`);
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

// fetch spiral abyss data
const fetchAbyssData = async (server: string, currUid: number, scheduleType = 1, i = 0) => {
  const apiUrl = `${spiralAbyssApiUrl}?server=os_${server}&role_id=${currUid}&schedule_type=${scheduleType}`;

  try {
    const resp = await axios.get(apiUrl, {
      headers: getHeaders(i),
      withCredentials: true,
    });

    return handleResponse(
      resp.data,
      () => {
        if (existingUids) purgePlayer(uid);
        return false;
      },
      () => {
        const maxFloor = resp.data.data.max_floor;

        if (maxFloor.split('-')[0] > 8) {
          currRefs[i].playerAbyssData = resp.data.data;
          return true;
        } else {
          return false;
        }
      },
    );
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Get player's owned character ids (filtered by built characters)
const fetchPlayerCharacters = async (server: string, currUid: number, i = 0, minLvl = 60) => {
  const apiUrl = `${userApiUrl}?server=os_${server}&role_id=${currUid}`;

  return axios
    .get(apiUrl, { headers: getHeaders(i), withCredentials: true })
    .then(async (resp) => {
      return handleResponse(
        resp.data,
        () => [],
        () =>
          map(
            filter(resp.data.data.avatars, (char) => char.level >= minLvl),
            (char) => char.id,
          ),
      );
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

const saveCharacterData = async (char: ICharacterResponse, i: number) => {
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
    ...pick(char.weapon, ['name', 'rarity', 'type_name', 'icon']),
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

  if (artifactSetCombinations.length < 1) return;

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
    player: currRefs[i].playerRef._id,
  };

  if (
    currRefs[i].playerAbyssData.damage_rank.length &&
    currRefs[i].playerAbyssData.damage_rank[0].avatar_id === character.oid
  ) {
    playerCharacter.strongest_strike = currRefs[i].playerAbyssData.damage_rank[0].value;
  }

  return PlayerCharacterModel.findOneAndUpdate(
    { character: characterRef._id, player: currRefs[i].playerRef._id },
    { $setOnInsert: playerCharacter },
    options,
  ).then((record: any) => {
    return { _id: record._doc._id, oid: character.oid };
  });
};

const saveAbyssData = (abyssData: IAbyssResponse, i: number) => {
  const abyssBattlePromises = [];

  forEach(
    filter(abyssData.floors, (floor) => floor.index > 8),
    (floor) => {
      forEach(
        filter(floor.levels, (level) => level.star > 0),
        (level) => {
          forEach(level.battles, async (battle) => {
            const abyssBattle = {
              floor_level: `${floor.index}-${level.index}`,
              battle_index: battle.index,
              star: level.star,
              player: currRefs[i].playerRef._id,
              party: map(battle.avatars, (char) => currRefs[i].playerCharRefMap[char.id.toString()]),
            };

            if (
              some(abyssBattle.party, (char) => char === null || char === undefined) ||
              abyssBattle.party.length < 4
            )
              return;

            const battleUpdate = AbyssBattleModel.findOneAndUpdate(
              {
                floor_level: `${floor.index}-${level.index}`,
                battle_index: battle.index,
                player: currRefs[i].playerRef._id,
              },
              { $setOnInsert: abyssBattle },
              options,
            );

            abyssBattlePromises.push(battleUpdate);
          });
        },
      );
    },
  );

  // console.log(abyssBattlePromises);

  return abyssBattlePromises;
};

const fetchPlayerData = async (server: string, curruid: number, characterIds: number[], i = 0) => {
  const reqBody = {
    character_ids: characterIds,
    server: `os_${server}`,
    role_id: curruid,
  };

  return axios
    .post(charApiUrl, reqBody, { headers: getHeaders(i), withCredentials: true })
    .then(async (resp) => {
      return handleResponse(
        resp.data,
        () => false,
        async () => {
          const records = await Promise.all(
            map(
              filter(resp.data.data.avatars, (char) => {
                return (
                  char.reliquaries.length > 4 &&
                  every(char.reliquaries, (artifact) => artifact.rarity > 3) &&
                  char.weapon.rarity > 2
                );
              }),
              (char) => saveCharacterData(char, i),
            ),
          );

          forEach(records, (record) => {
            if (record) {
              currRefs[i].playerCharRefMap[record.oid] = record._id;
            }
          });

          // Abyss data
          await Promise.all(saveAbyssData(currRefs[i].playerAbyssData, i));

          return true;
        },
      );
    })
    .catch((error) => {
      console.log(error);
    });
};

const collectDataFromPlayer = async (initUid = 0, i = 0) => {
  currRefs[i].token = await TokenModel.findOne().sort({ used: 1 }).limit(1).lean();
  await updateDS(i);

  const baseUid = _getBaseUid(server);
  const end = baseUid + 99999999;
  uid = (!!initUid ? initUid : baseUid) + i;
  let currUid = uid;

  while (uid < end) {
    if (existingUids) {
      const nextPlayer = await PlayerModel.findOne({ uid: { $gt: baseUid, $lt: baseUid + 99999999 } })
        .sort({ $natural: -1 })
        .skip(currSkip++)
        .limit(1)
        .lean();

      if (nextPlayer) {
        uid = nextPlayer.uid;
      } else {
        uid++;
      }
    }

    currUid = uid;
    currRefs[i].playerCharRefMap = {};
    areAllStillBlocked = true;
    // const now = new Date();

    try {
      const shouldCollectData = await fetchAbyssData(server, currUid, abyssSchedule, i);

      // Blocked
      if (shouldCollectData === null) {
        await nextToken(i);
        // await handleBlock(i);
        continue;
      } else if (shouldCollectData === undefined) {
        await updateDS(i);
        continue;
      }
      areAllStillBlocked = false;

      if (!shouldCollectData) {
        uid++;
        continue;
      }

      if (shouldCollectData) {
        console.log(`Collecting data for player ${currUid}...`);
        await nextToken(i);

        try {
          currRefs[i].playerRef = await PlayerModel.findOneAndUpdate(
            { uid: currUid },
            {
              uid: currUid,
              total_star: currRefs[i].playerAbyssData.total_star,
              total_battles: currRefs[i].playerAbyssData.total_battle_times,
              total_wins: currRefs[i].playerAbyssData.total_win_times,
              schedule_id: currRefs[i].playerAbyssData.schedule_id,
            },
            options,
          );

          let characterIds = [];

          // Every week we check for new characters
          // if (now.getTime() > weeklyUpdate) {
          //   weeklyUpdate = getNextMonday(now);

          //   characterIds = await fetchPlayerCharacters(server, currUid);
          //   await nextToken();

          //   // Otherwise we skip the API call
          // } else {
          // const playerCharacters = await PlayerCharacterModel.find({ player: currRefs[i].playerRef._id })
          //   .lean()
          //   .populate({ path: 'character', select: 'oid -_id' });

          // if (playerCharacters && playerCharacters.length > 0 && !includes(playerCharacters, undefined)) {
          //   characterIds = map(playerCharacters, ({ character }: any) => character.oid);
          // } else {
          characterIds = await fetchPlayerCharacters(server, currUid, i);
          await nextToken(i);
          // }
          // }

          if (characterIds === null) {
            // await handleBlock(i);
            continue;
          } else if (characterIds === undefined) {
            await updateDS(i);
            continue;
          } else {
            if (characterIds.length > 0) {
              const result = await fetchPlayerData(server, currUid, characterIds, i);
              await nextToken(i);

              if (result === null) {
                // await handleBlock(i);
                continue;
              } else if (result === undefined) {
                await updateDS(i);
                continue;
              } else {
                collectedTotal++;
                console.log('Total: ', collectedTotal);
              }
            }
            uid++;
          }
        } catch (err) {
          console.log(err);
        } finally {
          // if ( && now.getTime() > dailyUpdate) {
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

const runParallel = async (func: (i: number) => void) => {
  // First process is main process
  const funcs = concurrent ? map(Array(concurrent), (_, i) => () => func(i)) : [() => func(0)];

  await new Promise(() => {
    parallel(funcs);
  });
};

// Run functions
connectDb();
mongoose.connection.once('open', async () => {
  try {
    // await purgeOld();

    loadFromJson();
    // blockedIndices = new Array(TOKENS.length).fill(false);
    const now = new Date();
    dailyUpdate = getNextDay(now);
    weeklyUpdate = getNextMonday(now);

    concurrent = parseInt(process.env.npm_config_concurrent);
    server = process.env.npm_config_server ? process.env.npm_config_server : 'usa';
    currRefs = concurrent ? Array(concurrent).fill({}) : [{}];
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
        async (i: number) => await collectDataFromPlayer(parseInt(process.env.npm_config_uid), i),
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
          console.log(lastPlayer.uid + 1);
          await runParallel(async (i: number) => await collectDataFromPlayer(lastPlayer.uid + 1, i));
          break;
        }
        case 'resume': {
          console.log('Starting after last upated UID...');
          const lastUpdatedPlayer = await PlayerModel.findOne({
            uid: { $gt: baseUid, $lt: baseUid + 99999999 },
          })
            .limit(1)
            .sort({ $natural: 1 })
            .lean();

          await runParallel(
            async (i: number) => await collectDataFromPlayer(lastUpdatedPlayer.uid + 1, i),
          );
          break;
        }
        case 'all':
          console.log('Starting from base UID...');
          await runParallel(async (i: number) => await collectDataFromPlayer(null, i));
          break;
        case 'existing': {
          existingUids = true;
          console.log('Updating existing UIDs...');
          lastUpdatedUid = (
            await PlayerModel.findOne({ uid: { $gt: baseUid, $lt: baseUid + 99999999 } })
              .limit(1)
              .sort({ $natural: -1 })
              .lean()
          ).uid;
          await runParallel(async (i: number) => await collectDataFromPlayer(null, i));
          break;
        }
      }
    }
  } finally {
    await mongoose.connection.close();
  }
});
