import mongoose, { Schema } from 'mongoose';

import { IArtifactSet, IPlayer, IWeapon } from './interfaces';

interface IPlayerCharacterModel extends Document {
  artifactSets: Schema.Types.ObjectId[],
  constellation: number,
  element: string,
  fetter: number,
  level: number,
  weapon: Schema.Types.ObjectId,
  player: Schema.Types.ObjectId
}

const playerCharacterSchema = new Schema({
  character: {
    ref: 'Character',
    required: true,
    type: Schema.Types.ObjectId,
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
