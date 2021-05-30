import mongoose, { Schema } from 'mongoose';

import { IArtifactSet } from './interfaces';

interface IArtifactModel extends Document {
  id: number,
  name: string,
  rarity: number,
  icon: string,
  pos: number,
  pos_name: string,
  set: IArtifactSet
}

const artifactSchema = new Schema({
  id: {
    required: true,
    type: Number,
    unique: true
  },
  name: {
    required: true,
    type: String
  },
  rarity: {
    required: true,
    type: Number
  },
  icon: {
    required: true,
    type: String,
  },
  pos: {
    required: true,
    type: Number
  },
  pos_name: {
    required: true,
    type: Number
  },
  set: {
    required: true,
    ref: 'ArtifactSet',
    type: Schema.Types.ObjectId
  },
},
{timestamps: true});

export default mongoose.model<IArtifactModel>('Artifact', artifactSchema);
