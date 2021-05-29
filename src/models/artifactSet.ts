import mongoose, { Schema } from 'mongoose';

export interface IAffix { activation_number: Number, effect: string }

export interface IArtifact {
  id: number,
  name: number,
  pos: number,
  pos_name: string,
  set: IArtifactSet,
  icon: String
}

export interface IArtifactSet {
  affixes: IAffix[],
  id: number,
  name: string,
  rarity?: number
}

const artifactSetSchema = new Schema({
  affixes: [{
    activation_number: Number,
    effect: String
  }],
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
    type: Number
  },
  artifact: [{
    id: Number,
    name: Number,
    pos: Number,
    pos_name: String,
    icon: String
  }]
},
{timestamps: true});

export default mongoose.model('ArtifactSet', artifactSetSchema);
