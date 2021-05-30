import mongoose, { Schema } from 'mongoose';

import { IAbyssBattle, ICharacter } from './interfaces';

export interface IPlayerModel extends Document {
  abyss?: Schema.Types.ObjectId[],
  characters?: Schema.Types.ObjectId[],
  total_star: number,
  uid: number
}

const playerSchema = new Schema({
  abyss: [{
    ref: 'AbyssBattle',
    type: Schema.Types.ObjectId
  }],
  playerCharacters: [{
    ref: 'PlayerCharacter',
    type: Schema.Types.ObjectId
  }],
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
