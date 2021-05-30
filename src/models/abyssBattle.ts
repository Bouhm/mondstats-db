import mongoose, { Document, Schema } from 'mongoose';

import { IPlayer, IPlayerCharacter } from './interfaces';

interface IAbyssBattleModel extends Document {
  battle: number,
  party: Schema.Types.ObjectId[],
  floor: number,
  level: number,
  star: number,
  player: Schema.Types.ObjectId
}

const abyssBattleSchema = new Schema({
  battle: {
    required: true,
    type: Number
  },
  party: [{
    ref: 'PlayerCharacter',
    required: true,
    type: Schema.Types.ObjectId
  }],
  floor: {
    required: true,
    type: Number
  },
  level: {
    required: true,
    type: Number
  },
  star: {
    required: true,
    type: Number
  },
  player: {
    ref: 'Player',
    required: true,
    type: Schema.Types.ObjectId
  }
},
{timestamps: true});

export default mongoose.model<IAbyssBattleModel>('AbyssBattle', abyssBattleSchema);
