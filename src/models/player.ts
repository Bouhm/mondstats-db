import mongoose, { Schema } from 'mongoose';

import { IAbyssBattle, ICharacter } from './interfaces';

interface IPlayerModel extends Document {
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
  playerCharacters: [{
    ref: 'PlayerCharacter',
    required: true,
    type: Schema.Types.ObjectId
  }],
  max_floor: {
    required: true,
    type: String
  },
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
