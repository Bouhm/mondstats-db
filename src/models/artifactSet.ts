import mongoose, { Document, Schema } from 'mongoose';

export interface IAffix { activation_number: Number, effect: string }

interface IArtifactSet extends Document {
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
    required: true,
    type: String
  }
},
{timestamps: true});

export default mongoose.model<IArtifactSet>('ArtifactSet', artifactSetSchema);
