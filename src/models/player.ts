import mongoose, { Schema } from 'mongoose';

import { IAbyssBattle, ICharacter } from './interfaces';

export interface IPlayerModel extends Document {
  total_star: number,
  uid: number
}

const playerSchema = new Schema({
  total_star: {
    required: true,
    type: Number
  },
  uid: {
    required: true,
    type: Number,
    unique: true
  }
},
{timestamps: true});

export default mongoose.model<IPlayerModel>('Player', playerSchema);
