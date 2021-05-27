import mongoose, { Schema } from 'mongoose';

import { IArtifactSet } from './artifactSet';

export interface IArtifact extends Document {
  id: number,
  name: number,
  pos: number,
  pos_name: string,
  rarity: number,
  set: IArtifactSet
}

const artifactSchema = new Schema({
  id: {
    required: true,
    type: Number,
    unique: true
  },
  name: {
    type: String
  },
  pos: {
    type: Number
  },
  pos_name: {
    type: String
  },
  rarity: {
    type: Number
  },
  set: {
    ref: 'ArtifactSet',
    type: Schema.Types.ObjectId
  }
},
{timestamps: true});

export default mongoose.model('Artifact', artifactSchema);
