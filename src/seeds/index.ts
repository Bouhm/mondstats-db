'use strict';
import Axios from 'axios';
import fs from 'fs';
import https from 'https';
import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import { AbyssBattleService } from 'src/abyss-battle/abyss-battle.service';
import { ArtifactSetService } from 'src/artifact-set/artifact-set.service';
import { ArtifactService } from 'src/artifact/artifact.service';
import { CharacterService } from 'src/character/character.service';
import { PlayerCharacterService } from 'src/player-character/player-character.service';
import { PlayerService } from 'src/player/player.service';
import connectDb from 'src/util/connection';
import { WeaponService } from 'src/weapon/weapon.service';

import { Artifact } from '../artifact/artifact.model';
import { Character } from '../character/character.model';
import {
  PlayerCharacter,
  PlayerCharacterDocument,
} from '../player-character/player-character.model';
import { PlayerDocument } from '../player/player.model';
import { Weapon } from '../weapon/weapon.model';
import { IAbyssResponse, ICharacterResponse } from './interfaces';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const DEVELOPMENT = true;

const spiralAbyssApiUrl =
  'https://api-os-takumi.mihoyo.com/game_record/genshin/api/spiralAbyss';
const userApiUrl =
  'https://api-os-takumi.mihoyo.com/game_record/genshin/api/index';
const charApiUrl =
  'https://bbs-api-os.hoyolab.com/game_record/genshin/api/character';

const axios = Axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const tokensPath = './src/keys/tokens.json';
const proxiesPath = './src/keys/proxies.json';
const dsPath = './src/keys/DS.json';

let PROXIES: Array<{ ip: string; port: string }> = [];
let TOKENS: string[] = [];
let DS: string[] = [];
let timeoutBox: string[] = [];
let proxyIdx = 0;
let accIdx = 0;
let iterationStart = Date.now();
let isAllBlocked = true;
let blockedLevel = 0;
const longRests = [60 * 60 * 1000, 6 * 60 * 60 * 1000, 12 * 60 * 60 * 1000];
const maxRest = (60 * 10 * 1000) / 30;

let playerRef: PlayerDocument;
let playerCharacterRefs: PlayerCharacterDocument[] = [];
let playerAbyssData: IAbyssResponse;
const options = {
  upsert: true,
  new: true,
  runValidators: true,
  useFindAndModify: false,
};

const _incrementAccIdx = async () => {
  accIdx++;
  _incrementProxyIdx();

  if (accIdx > TOKENS.length - 1) {
    accIdx = 0;

    if (proxyIdx + TOKENS.length > PROXIES.length - 1) {
      proxyIdx = 0;
    } else {
      proxyIdx += TOKENS.length;
    }

    const restMs = _clamp(0, maxRest, Date.now() - iterationStart) + 1000;
    iterationStart = Date.now();
    await _sleep(restMs);
  }

  // if (DEVELOPMENT) console.log("using next acc... " + accIdx);
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

function _clamp(min: number, max: number, num: number) {
  return Math.min(Math.max(num, min), max);
}

const getHeaders = () => {
  proxyIdx = _clamp(0, PROXIES.length - 1, proxyIdx);
  accIdx = _clamp(0, TOKENS.length - 1, accIdx);

  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json;charset=utf-8',
    'x-rpc-app_version': '1.5.0',
    'x-rpc-language': 'en-us',
    'X-Forwarded-For': PROXIES[proxyIdx].ip,
    'X-Forwarded-Port': PROXIES[proxyIdx].port,
    Origin: 'https://webstatic-sea.hoyolab.com',
    DNT: '1',
    DS: DS[0],
    Connection: 'keep-alive',
    Referer: 'https://webstatic-sea.hoyolab.com/',
    Cookie: TOKENS[accIdx],
    TE: 'Trailers',
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

    if (isAllBlocked) {
      blockedLevel++;

      if (blockedLevel > longRests.length - 1) {
        blockedLevel = longRests.length - 1;
      }
    } else {
      blockedLevel = 0;
    }

    console.log(new Date(), `Long wait...`);
    await _sleep(longRests[blockedLevel]);
  }
};

// Aggregate spiral abyss data
const getSpiralAbyssThreshold = async (
  server: string,
  uid: number,
  threshold = 8,
) => {
  const apiUrl = `${spiralAbyssApiUrl}?server=os_${server}&role_id=${uid}&schedule_type=2`;

  try {
    const resp = await axios.get(apiUrl, {
      headers: getHeaders(),
      withCredentials: true,
    });

    // Rate limit reached message
    if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
      return null;
    }
    // if (resp.data && resp.data.message && DEVELOPMENT) console.log("First pass: " + resp.data.message);
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
const getPlayerCharacters = async (
  server: string,
  uid: number,
  threshold = 40,
) => {
  const apiUrl = `${userApiUrl}?server=os_${server}&role_id=${uid}`;

  return axios
    .get(apiUrl, { headers: getHeaders(), withCredentials: true })
    .then((resp) => {
      // Rate limit reached message
      if (resp.data && resp.data.message && resp.data.message.startsWith('Y')) {
        return null;
      }
      // if (resp.data && resp.data.message && DEVELOPMENT) console.log("Second pass: " + resp.data.message);
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

const aggregateCharacterData = async (char: ICharacterResponse) => {
  // Update database
  // Weapons
  const charWeapon: Weapon = _.pick(char.weapon, [
    'id',
    'desc',
    'name',
    'rarity',
    'type',
    'type_name',
    'icon',
  ]);

  const weaponRef = await WeaponService.findOneAndUpdate(
    { id: charWeapon.id },
    { $setOnInsert: charWeapon },
    options,
  );

  const artifactRefIds: Schema.Types.ObjectId[] = [];
  // Artifacts
  for (const artifact of char.reliquaries) {
    const charArtifact: Artifact = _.pick(artifact, [
      'id',
      'name',
      'rarity',
      'icon',
      'pos',
      'pos_name',
    ]);

    const artifactSetRef = await ArtifactSetService.findOneAndUpdate(
      { id: artifact.set.id },
      { $setOnInsert: artifact.set },
      options,
    );
    charArtifact.set = artifactSetRef._id;

    const artifactRef = await ArtifactService.findOneAndUpdate(
      { id: charArtifact.id },
      { $setOnInsert: charArtifact },
      options,
    );
    artifactRefIds.push(artifactRef._id);
  }

  // Characters
  const character: Character = _.pick(char, [
    'constellations',
    'element',
    'id',
    'name',
    'rarity',
  ]);

  // _.map(character.constellations, constellation => {
  //   delete constellation.is_actived
  // })

  const characterRef = await CharacterService.findOneAndUpdate(
    { id: character.id },
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

    const playerCharacter: PlayerCharacter = {
      id: character.id,
      character: characterRef._id,
      artifacts: artifactRefIds,
      constellation: cNum,
      element: character.element,
      fetter: char.fetter,
      level: char.level,
      weapon: weaponRef._id,
      player: playerRef._id,
    };

    const playerCharacterRef = await PlayerCharacterService.findOneAndUpdate(
      { character: characterRef._id, player: playerRef._id },
      { $setOnInsert: playerCharacter },
      options,
    );
    playerCharacterRefs.push(playerCharacterRef);
  }
};

const aggregateAbyssData = async (abyssData: IAbyssResponse) => {
  _.map(
    _.filter(abyssData.floors, (floor) => floor.index > 8),
    (floor) => {
      _.map(
        _.filter(floor.levels, (level) => level.star > 0),
        async (level) => {
          for (const battle of level.battles) {
            const party: any[] = [];
            for (const char of battle.avatars) {
              try {
                const member = _.find(playerCharacterRefs, { id: char.id });
                if (!member) return;

                party.push(member._id);
              } catch (err) {
                console.log(err);
              }
            }

            const abyssBattle = {
              battle: battle.index,
              level: level.index,
              floor: floor.index,
              star: level.star,
              player: playerRef._id,
              party,
            };

            await AbyssBattleService.findOneAndUpdate(
              {
                battle: abyssBattle.battle,
                level: level.index,
                floor: floor.index,
                player: playerRef._id,
              },
              { $setOnInsert: abyssBattle },
              options,
            );
          }
        },
      );
    },
  );
};

const aggregatePlayerData = async (
  server: string,
  uid: number,
  characterIds: number[],
) => {
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
        return null;
      }
      // if (resp.data && resp.data.message && DEVELOPMENT) console.log("Third pass : " + resp.data.message);
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
      await aggregateAbyssData(playerAbyssData);

      return true;
    })
    .catch((error) => {
      console.log(error);
    });
};

const aggregateAllCharacterData = async (startUid = 0) => {
  let firstPass = false;

  const baseUid = _getBaseUid(server);
  const end = baseUid + 99999999;
  let blockedIdx = 0;
  let uid = !!startUid ? startUid : baseUid;

  while (uid < end) {
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
    playerCharacterRefs = [];
    isAllBlocked = true;

    try {
      let shouldCollectData: boolean | null = firstPass;
      if (!firstPass) {
        shouldCollectData = await getSpiralAbyssThreshold(server, uid);
        blockedIdx = accIdx;
        await _incrementAccIdx();
      }

      // Blocked
      if (shouldCollectData === null) {
        await handleBlock(blockedIdx);
        if (DEVELOPMENT) console.log(timeoutBox.length + ' blocked at ' + uid);

        continue;
      }
      isAllBlocked = false;

      if (!shouldCollectData) {
        uid++;
        continue;
      }

      if (shouldCollectData) {
        try {
          firstPass = true;
          playerRef = await PlayerService.findOneAndUpdate(
            { uid },
            { uid, total_star: playerAbyssData.total_star },
            options,
          );

          const characterIds = await getPlayerCharacters(server, uid);
          blockedIdx = accIdx;
          await _incrementAccIdx();

          if (characterIds === null) {
            await handleBlock(blockedIdx);
            if (DEVELOPMENT)
              console.log(timeoutBox.length + ' blocked at ' + uid);
            continue;
          } else {
            isAllBlocked = false;
            if (characterIds.length > 0) {
              const result = await aggregatePlayerData(
                server,
                uid,
                characterIds,
              );
              blockedIdx = accIdx;
              await _incrementAccIdx();

              if (result === null) {
                await handleBlock(blockedIdx);
                if (DEVELOPMENT)
                  console.log(timeoutBox.length + ' blocked at ' + uid);
                continue;
              } else {
                isAllBlocked = false;
                firstPass = false;
              }
            }
            uid++;
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
  DS = _.shuffle(JSON.parse(fs.readFileSync(dsPath, 'utf-8')));
  // sampleChars = JSON.parse(fs.readFileSync('./src/db/sampleChars.json', 'utf-8'));
  // sampleAbyss = JSON.parse(fs.readFileSync('./src/db/sampleAbyss.json', 'utf-8'));
};

// Run functions
connectDb();
mongoose.connection.once('open', async () => {
  loadFromJson();

  // playerRef = await PlayerService.findOne({ uid: 607942345 });
  // await Promise.all(_.map(sampleChars.data.avatars, async (char) => {
  //   return aggregateCharacterData(char);
  // }))
  // await aggregateAbyssData(sampleAbyss.data);

  // await Player.find({}, {}, { sort: { 'uid': -1 }, limit: 1 }, function(err, post) {
  //   console.log( post );
  // });
  aggregateAllCharacterData(817467005);
});
