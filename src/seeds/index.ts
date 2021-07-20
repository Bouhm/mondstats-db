'use strict';
import Axios from 'axios';
import fs from 'fs';
import https from 'https';
import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import { firefox } from 'playwright-firefox';

import AbyssBattleModel from '../abyss-battle/abyss-battle.model';
import ArtifactSetModel from '../artifact-set/artifact-set.model';
import ArtifactModel from '../artifact/artifact.model';
import CharacterModel from '../character/character.model';
import PlayerCharacterModel from '../player-character/player-character.model';
import PlayerModel, { PlayerDocument } from '../player/player.model';
import connectDb from '../util/connection';
import WeaponModel from '../weapon/weapon.model';
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

const tokensPath = './src/keys/tokens.json';
const proxiesPath = './src/keys/proxies.json';
// const dsPath = './src/keys/DS.json';

let PROXIES: Array<{ ip: string; port: string }> = [];
let TOKENS: string[] = [];
let DS = '';
let blockedIndices: boolean[] = [];
let proxyIdx = 0;
let tokenIdx = 0;
let iterationStart = Date.now();
let areAllStillBlocked = true;
let abyssSchedule = 1;
const blockedLevel = 0;
const maxRest = (24 * 60 * 60 * 1000) / 30;
const delayMs = 5000;
const count = 0;
let collectedTotal = 0;

let playerRef: PlayerDocument;
let playerCharRefMap: { [oid: string]: any } = {};
let playerAbyssData: IAbyssResponse;

const options = {
  upsert: true,
  new: true,
  runValidators: true,
  useFindAndModify: false,
};

const assignTraveler = (charData: ICharacterResponse) => {
  let oid = 100;
  let element = 'Anemo';

  switch (charData.constellations[0].id) {
    // Anemo
    case 71:
      element = 'Anemo';
      oid = 100;
      break;
    // Geo
    case 91:
      element = 'Geo';
      oid = 101;
      break;
    default:
      break;
  }

  return {
    oid,
    element,
  };
};

const _incrementTokenIdx = async () => {
  tokenIdx++;
  _incrementProxyIdx();

  if (tokenIdx > TOKENS.length - 1) {
    tokenIdx = 0;

    if (proxyIdx + TOKENS.length > PROXIES.length - 1) {
      proxyIdx = 0;
    } else {
      proxyIdx += TOKENS.length;
    }

    const restMs = _.clamp(maxRest - (Date.now() - iterationStart), 0, maxRest) + delayMs;
    iterationStart = Date.now();
    await _sleep(restMs);
  }

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

// Grab DS
const _updateDS = async () => {
  try {
    // const cookieTokens = TOKENS[tokenIdx].split(' ');
    // const ltoken = cookieTokens[0].split('=')[1].slice(0, -1);
    // const ltuid = cookieTokens[1].split('=')[1];

    const browser = await firefox.launch();
    const context = await browser.newContext({
      extraHTTPHeaders: {
        Cookie: TOKENS[tokenIdx],
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
      await page.goto(url);
    });
  } catch {
    await _sleep(30 * 1000);
    console.log('Failed to update DS, trying again...');
    return await _updateDS();
  }
};

const getHeaders = () => {
  proxyIdx = _.clamp(proxyIdx, 0, PROXIES.length - 1);
  tokenIdx = _.clamp(tokenIdx, 0, TOKENS.length - 1);

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
    Cookie: TOKENS[tokenIdx],
    TE: 'Trailers',
    'X-Forwarded-For': PROXIES[proxyIdx].ip,
    'X-Forwarded-Port': PROXIES[proxyIdx].port,
  };
};

const server = 'asia';

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

const handleBlock = async (tokenIdx: number) => {
  blockedIndices[tokenIdx] = true;
  console.log(`${_.filter(blockedIndices, (blocked) => blocked).length}/${blockedIndices.length}`);

  if (_.filter(blockedIndices, (blocked) => blocked).length >= TOKENS.length) {
    console.log('--- ALL BLOCKED ---');
    // if (areAllStillBlocked) {
    //   blockedLevel++;

    //   if (blockedLevel > longRests.length - 1) {
    //     blockedLevel = longRests.length - 1;
    //   }
    // } else {
    //   blockedLevel = 0;
    // }

    console.log('Long rest...', new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    await _sleep(maxRest);
    blockedIndices = new Array(TOKENS.length).fill(false);
  }
};

// Aggregate spiral abyss data
const getSpiralAbyssData = async (
  server: string,
  uid: number,
  scheduleType = 1,
  threshold = 9,
  secondTry = false,
) => {
  const apiUrl = `${spiralAbyssApiUrl}?server=os_${server}&role_id=${uid}&schedule_type=${scheduleType}`;

  try {
    const resp = await axios.get(apiUrl, {
      headers: getHeaders(),
      withCredentials: true,
    });

    // console.log(resp.data.message, tokenIdx, ++count);
    // Rate limit reached message
    if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
      // console.log('Abyss data: ', resp.data.message);
      return null;
    }
    if (resp.data && resp.data.message && resp.data.message.startsWith('invalid')) {
      // console.log('Abyss data: ', resp.data.message);
      return undefined;
    }
    if (!resp.data || !resp.data.data) {
      return false;
    }

    const maxFloor = resp.data.data.max_floor;

    if (maxFloor.split('-')[0] >= threshold) {
      playerAbyssData = resp.data.data;
      return true;
    } else if (secondTry) {
      return false;
    } else {
      // Try again with other abyss schedule
      const newSchedule = scheduleType === 1 ? 2 : 1;
      return await getSpiralAbyssData(server, uid, newSchedule, threshold, true);
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Get player's owned character ids
const getPlayerCharacters = async (server: string, uid: number, threshold = 40) => {
  const apiUrl = `${userApiUrl}?server=os_${server}&role_id=${uid}`;

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

      return _.map(
        _.filter(resp.data.data.avatars, (char) => char.level >= threshold),
        (char) => char.id,
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
  _.forEach(activations, (activation_num) => {
    if (count >= activation_num) {
      activation = activation_num;
    }
  });

  return activation;
}

const aggregateCharacterData = async (char: ICharacterResponse) => {
  const artifactSets: IArtifactSet = {};
  _.forEach(char.reliquaries, (relic) => {
    if (artifactSets.hasOwnProperty(relic.set.id)) {
      artifactSets[relic.set.id].count++;
    } else {
      artifactSets[relic.set.id] = {
        count: 1,
        affixes: relic.set.affixes,
      };
    }
  });

  const artifactSetCombinations: { id: number; activation_number: number }[] = [];

  _.forIn(artifactSets, (setData, id) => {
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
    !artifactSetCombinations.length ||
    (artifactSetCombinations.length === 1 && artifactSetCombinations[0].activation_number < 4)
  )
    return;

  // Update database
  // Weapons
  const charWeapon = {
    oid: char.weapon.id,
    ..._.pick(char.weapon, [
      'desc',
      'name',
      'rarity',
      'level',
      'affix_level',
      'type',
      'type_name',
      'icon',
    ]),
  };

  const weaponRef = await WeaponModel.findOneAndUpdate(
    { oid: charWeapon.oid },
    { $setOnInsert: charWeapon },
    options,
  );

  const artifactRefIds: Schema.Types.ObjectId[] = [];
  // Artifacts
  for (const artifact of char.reliquaries) {
    const charArtifact = {
      oid: artifact.id,
      ..._.pick(artifact, ['name', 'rarity', 'icon', 'pos', 'pos_name']),
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

  // Characters
  const character = {
    oid: char.id,
    ..._.pick(char, ['element', 'name', 'rarity', 'icon', 'image']),
    constellations: _.map(char.constellations, (constellation) => {
      return {
        oid: constellation.id,
        icon: constellation.icon,
        name: constellation.name,
        effect: constellation.effect,
        pos: constellation.pos,
      };
    }),
  };

  if (character.name === 'Traveler') {
    const { oid, element } = assignTraveler(char);
    character.oid = oid;
    character.element = element;
  }

  // _.map(character.constellations, constellation => {
  //   delete constellation.is_actived
  // })

  const characterRef = await CharacterModel.findOneAndUpdate(
    { oid: character.oid },
    { $setOnInsert: character },
    options,
  );

  if (artifactRefIds.length === 5) {
    // PlayerCharacters
    let cNum = 0;
    for (let i = 0; i < 6; i++) {
      if (char.constellations[i].is_actived) {
        cNum++;
      }
    }

    const playerCharacter: any = {
      oid: character.oid,
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
    playerCharRefMap[playerCharacter.oid] = playerCharacterRef._id;
  }
};

const aggregateAbyssData = (abyssData: IAbyssResponse) => {
  _.map(
    _.filter(abyssData.floors, (floor) => floor.index > 8),
    (floor) => {
      _.map(
        _.filter(floor.levels, (level) => level.star > 2),
        (level) => {
          _.forEach(level.battles, async (battle) => {
            const abyssBattle = {
              floor_level: `${floor.index}-${level.index}`,
              battle_index: battle.index,
              player: playerRef._id,
              party: _.map(battle.avatars, (char) => playerCharRefMap[char.id]),
            };

            if (_.some(abyssBattle.party, (char) => char === null || char === undefined)) return;

            await AbyssBattleModel.findOneAndUpdate(
              {
                floor_level: `${floor.index}-${level.index}`,
                battle_index: battle.index,
                player: playerRef._id,
              },
              { $setOnInsert: abyssBattle },
              options,
            );
          });
        },
      );
    },
  );
};

const aggregatePlayerData = async (server: string, uid: number, characterIds: number[]) => {
  const reqBody = {
    character_ids: characterIds,
    server: `os_${server}`,
    role_id: uid,
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
        _.map(resp.data.data.avatars, async (char) => {
          if (
            char.weapon.rarity >= 3 &&
            char.reliquaries.length === 5 &&
            !_.find(char.reliquaries, (relic) => relic.rarity <= 3)
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

const aggregateAllCharacterData = async (initUid = 0, uids = []) => {
  const baseUid = _getBaseUid(server);
  const end = baseUid + 99999999;
  let currTokenIdx = 0;
  let uid = !!initUid ? initUid : baseUid;

  while (uid < end) {
    if (uids.length) {
      uid = uids.pop();
    }

    playerCharRefMap = {};
    areAllStillBlocked = true;

    try {
      const shouldCollectData = await getSpiralAbyssData(server, uid, abyssSchedule);

      // Blocked
      if (shouldCollectData === null) {
        currTokenIdx = tokenIdx;
        await _incrementTokenIdx();
        await handleBlock(currTokenIdx);
        continue;
      } else if (shouldCollectData === undefined) {
        await _updateDS();
        continue;
      }
      areAllStillBlocked = false;

      if (!shouldCollectData) {
        if (!uids.length) uid++;
        continue;
      }

      if (shouldCollectData) {
        console.log(`Collecting data for player ${uid}...`);
        currTokenIdx = tokenIdx;
        await _incrementTokenIdx();

        try {
          playerRef = await PlayerModel.findOneAndUpdate(
            { uid },
            {
              uid,
              total_star: playerAbyssData.total_star,
              total_battles: playerAbyssData.total_battle_times,
              total_wins: playerAbyssData.total_win_times,
              schedule_id: playerAbyssData.schedule_id,
            },
            options,
          );

          let characterIds = [];
          const playerCharacters = await PlayerCharacterModel.find({ player: playerRef._id })
            .lean()
            .populate({ path: 'character', select: 'oid -_id' });

          if (playerCharacters && playerCharacters.length > 0) {
            characterIds = _.map(playerCharacters, (pc: any) => pc.oid);
          } else {
            characterIds = await getPlayerCharacters(server, uid);
            currTokenIdx = tokenIdx;
            await _incrementTokenIdx();
          }

          if (characterIds === null) {
            await handleBlock(currTokenIdx);
            continue;
          } else if (characterIds === undefined) {
            await _updateDS();
            continue;
          } else {
            areAllStillBlocked = false;
            if (characterIds.length > 0) {
              const result = await aggregatePlayerData(server, uid, characterIds);
              currTokenIdx = tokenIdx;
              await _incrementTokenIdx();

              if (result === null) {
                await handleBlock(currTokenIdx);
                continue;
              } else if (result === undefined) {
                await _updateDS();
                continue;
              } else {
                areAllStillBlocked = false;
                collectedTotal++;
                console.log('Total: ', collectedTotal);
              }
            }
            if (!uids.length) uid++;
          }
        } catch (err) {
          console.log(err);
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
  TOKENS = _.shuffle(JSON.parse(fs.readFileSync(tokensPath, 'utf-8')));
  PROXIES = _.shuffle(JSON.parse(fs.readFileSync(proxiesPath, 'utf-8')));
  // DS = _.shuffle(JSON.parse(fs.readFileSync(dsPath, 'utf-8')));
  // sampleChars = JSON.parse(fs.readFileSync('./src/db/sampleChars.json', 'utf-8'));
  // sampleAbyss = JSON.parse(fs.readFileSync('./src/db/sampleAbyss.json', 'utf-8'));
};

// Run functions
connectDb();
mongoose.connection.once('open', async () => {
  // await PlayerCharacterModel.deleteMany({
  //   createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  // });
  // await PlayerModel.deleteMany({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  // await AbyssBattleModel.deleteMany({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });

  loadFromJson();
  blockedIndices = new Array(TOKENS.length).fill(false);

  await _updateDS();

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
    aggregateAllCharacterData(parseInt(process.env.npm_config_uid));
  } else {
    switch (process.env.npm_config_uid) {
      default:
      case 'last':
        console.log('Starting after last UID...');
        const lastPlayer = await PlayerModel.findOne().limit(1).sort('-uid');
        aggregateAllCharacterData(lastPlayer.uid + 1);
        break;
      case 'all':
        console.log('Starting from base UID...');
        aggregateAllCharacterData();
        break;
      case 'existing':
        console.log('Updating existing UIDs...');
        // NEWEST TO OLDEST -- WE UPDATE IN REVERSE ORDER
        const players = await PlayerModel.find().sort({ updatedAt: -1 });
        const uids = _.map(players, (player) => player.uid);
        aggregateAllCharacterData(0, uids);
        break;
    }
  }

  return () => mongoose.connection.close();
});
