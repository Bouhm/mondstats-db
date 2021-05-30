import mongoose, { Schema } from 'mongoose';

import { IArtifactSet, IPlayer, IWeapon } from './interfaces';

export interface IPlayerCharacterModel extends Document {
  id: number,
  artifacts: Schema.Types.ObjectId[],
  constellation: number,
  element: string,
  fetter: number,
  level: number,
  weapon: Schema.Types.ObjectId,
  player: Schema.Types.ObjectId
}

const playerCharacterSchema = new Schema({
  id: {
    required: true,
    type: Number
  },
  character: {
    required: true,
    ref: 'Character',
    type: Schema.Types.ObjectId
  },
  artifacts: [{
    required: true,
    ref: 'Artifact',
    type: Schema.Types.ObjectId
  }],
  constellation: {
    required: true,
    type: Number
  },
  fetter: {
    required: true,
    type: Number
  },
  level: {
    required: true,
    type: Number
  },
  weapon: {
    required: true,
    ref: 'Weapon',
    type: Schema.Types.ObjectId
  },
  player: {
    ref: 'Player',
    required: true,
    type: Schema.Types.ObjectId
  }
},
{timestamps: true});

export default mongoose.model<IPlayerCharacterModel>('PlayerCharacter', playerCharacterSchema);
