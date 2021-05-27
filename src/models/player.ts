import mongoose, { Schema } from 'mongoose';

import { IAbyssBattle } from './abyssBattle';
import { ICharacter } from './character';

export interface IPlayer extends Document {
  abyss: IAbyssBattle[],
  characters: ICharacter[],
  max_floor: string,
  total_star: number,
  uid: number
}

const playerSchema = new Schema({
  abyss: [{
    ref: 'AbyssBattle',
    required: true,
    type: Schema.Types.ObjectId
  }],
  characters: [{
    ref: 'Character',
    required: true,
    type: Schema.Types.ObjectId
  }],
  max_floor: {
    type: String
  },
  total_star: {
    type: Number
  },
  uid: {
    required: true,
    type: Number,
    unique: true
  }
},
{timestamps: true});

export default mongoose.model('Player', playerSchema);
