import mongoose, { Schema } from 'mongoose';

export interface IAffix { activation_number: number, effect: string }

export interface IArtifactSet extends Document {
  affixes: IAffix[],
  id: number,
  name: string
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
    type: String
  }
},
{timestamps: true});

export default mongoose.model('ArtifactSet', artifactSetSchema);
