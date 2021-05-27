import mongoose, { Document, Schema } from 'mongoose';

import { ICharacter } from './character';

export interface IAbyssBattle extends Document {
  battle: number,
  characters: ICharacter[],
  floor: number,
  max_star: number,
  stage: number,
  star: number
}

const abyssBattleSchema = new Schema({
  battle: {
    required: true,
    type: Number
  },
  characters: [{
    ref: 'Character',
    required: true,
    type: Schema.Types.ObjectId
  }],
  floor: {
    required: true,
    type: Number
  },
  max_star: {
    type: Number
  },
  stage: {
    required: true,
    type: Number
  },
  star: {
    type: Number
  }
},
{timestamps: true});

export default mongoose.model<IAbyssBattle>('AbyssBattle', abyssBattleSchema);
