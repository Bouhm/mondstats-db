import { Schema } from 'mongoose';

export interface IAbyssBattle {
  battle: number,
  party: Schema.Types.ObjectId[],
  floor: number,
  stage: number,
  star: number,
  player: Schema.Types.ObjectId
}

export interface IAffix { activation_number: Number, effect: string }

export interface IArtifact {
  id: number,
  name: string,
  pos: number,
  pos_name: string,
  set?: Schema.Types.ObjectId,
  icon: string,
  rarity: number
}

export interface IArtifactSet {
  affixes: IAffix[],
  id: number,
  name: string
}

export interface IConstellation {
  effect: string,
  id: number,
  name: string,
  pos: number,
  icon: string
}

export interface ICharacter {
  constellations: IConstellation[],
  element: string,
  id: number,
  name: string,
  rarity: number
}

export interface IPlayer {
  abyss?: Schema.Types.ObjectId[],
  characters?: Schema.Types.ObjectId[],
  total_star: number,
  uid: number
}

export interface IPlayerCharacter {
  character: Schema.Types.ObjectId,
  artifacts: Schema.Types.ObjectId[],
  constellation: number,
  fetter: number,
  level: number,
  weapon: Schema.Types.ObjectId,
  player: Schema.Types.ObjectId
}

export interface IWeapon {
  desc: string,
  id: number,
  name: string,
  rarity: number,
  type: number,
  type_name: string,
  icon: string
}

export interface IAbyssResponse {
  schedule_id: number,
  start_time: string,
  end_time: string,
  total_battle_times: number,
  total_win_times: number,
  max_floor: string,
  reveal_rank: any,
  defeat_rank: any,
  damage_rank: any,
  take_damage_rank: any,
  normal_skill_rank: any,
  energy_skill_rank: any,
  total_star: number,
  is_unlock: boolean,
  floors: {
    index: number,
    icon: string,
    is_unlock: boolean,
    settle_time: string,
    star: number,
    max_star: number, 
    levels: {
      index: number,
      star: number,
      max_star: number,
      battles: {
        index: number,
        timestamp: string,
        avatars: {
          id: number,
          icon: string,
          level: number,
          rarity: number
        }[]
      }[]
    }[]
  }[]
}

export interface ICharacterResponse {
  id: number,
  image: string,
  icon: string,
  name: string,
  element: string,
  fetter: number,
  level: number,
  rarity: number,
  weapon: IWeaponResponse,
  reliquaries: IArtifactResponse[],
  constellations: IConstellationResponse[]
}

export interface IWeaponResponse {
  id: number,
  name: string,
  icon: string,
  type: number,
  rarity: number,
  level: number,
  promote_level: number,
  type_name: string,
  desc: string,
  affix_level: number
}

export interface IArtifactResponse {
  id: number,
  name: string,
  icon: string,
  pos: number,
  rarity: number,
  level: number,
  set: {
    id: number,
    name: string,
    affixes: IAffix[]
  },
  pos_name: string
}

export interface IConstellationResponse {
  id: number,
  name: string,
  icon: string,
  effect: string,
  is_actived: boolean,
  pos: number
}