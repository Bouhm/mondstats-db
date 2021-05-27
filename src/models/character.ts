import mongoose, { Schema } from 'mongoose';

import { IArtifactSet } from './artifactSet';
import { IConstellation } from './constellation';
import { IWeapon } from './weapon';

export interface ICharacter extends Document {
  artifactSets?: IArtifactSet[],
  constellations: IConstellation[],
  element: string,
  fetter?: number,
  id: number,
  level?: number,
  name: number,
  weapon?: IWeapon,
}

const characterSchema = new Schema({
  artifactSets: [{
    ref: 'ArtifactSet',
    type: Schema.Types.ObjectId
  }],
  constellations: [{
    ref: 'Constellation',
    type: Schema.Types.ObjectId
  }],
  element: {
    type: String
  },
  fetter: {
    type: Number
  },
  id: {
    required: true,
    type: Number,
    unique: true
  },
  level: {
    type: Number
  },
  name: {
    type: String
  },
  weapon: {
    ref: 'Weapon',
    type: Schema.Types.ObjectId
  }
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
