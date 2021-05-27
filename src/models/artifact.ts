import mongoose, { Schema } from 'mongoose';

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
