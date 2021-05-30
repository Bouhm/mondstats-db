export interface IAbyssBattle {
  battle: number,
  characters: ICharacter[],
  floor: number,
  stage: number,
  star: number
}

export interface IAffix { activation_number: Number, effect: string }

export interface IArtifact {
  id: number,
  name: string,
  pos: number,
  pos_name: string,
  set: IArtifactSet,
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
  abyss: IAbyssBattle[],
  characters: ICharacter[],
  max_floor: string,
  total_star: number,
  uid: number
}

export interface IPlayerCharacter {
  character: ICharacter,
  artifacts: IArtifact[],
  constellation: number,
  fetter: number,
  level: number,
  weapon: IWeapon,
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
    }
  }
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