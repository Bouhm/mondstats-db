import mongoose, { Schema } from 'mongoose';

import { IArtifactSet } from './artifactSet';
import { IWeapon } from './weapon';

export interface IPlayerCharacter {
  artifactSets: IArtifactSet[],
  constellation: number,
  element: string,
  fetter: number,
  level: number,
  weapon: IWeapon,
}

const playerCharacterSchema = new Schema({
  character: {
    ref: 'Character',
    required: true,
    type: Schema.Types.ObjectId,
  },
  artifactSets: [{
    required: true,
    ref: 'ArtifactSet',
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
  }
},
{timestamps: true});

export default mongoose.model('PlayerCharacter', playerCharacterSchema);
