import mongoose, { Document, Schema } from 'mongoose';

import { ICharacter } from './character';

export interface IAbyssBattle {
  battle: number,
  characters: ICharacter[],
  floor: number,
  stage: number,
  star: number
}

const abyssBattleSchema = new Schema({
  battle: {
    required: true,
    type: Number
  },
  characters: [{
    ref: 'PlayerCharacter',
    required: true,
    type: Schema.Types.ObjectId
  }],
  floor: {
    required: true,
    type: Number
  },
  stage: {
    required: true,
    type: Number
  },
  star: {
    required: true,
    type: Number
  }
},
{timestamps: true});

export default mongoose.model('AbyssBattle', abyssBattleSchema);
