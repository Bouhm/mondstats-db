import mongoose, { Schema } from 'mongoose';

const artifactSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  pos: {
    type: Number,
    required: true
  },
  rarity: {
    type: Number,
    required: true
  },
  set: {
    type: Schema.Types.ObjectId,
    ref: 'ArtifactSet',
    required: true
  }
},
{timestamps: true});

export default mongoose.model('Artifact', artifactSchema);
