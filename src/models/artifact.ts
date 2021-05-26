import mongoose, { Schema } from 'mongoose';

const artifactSchema = new Schema({
  id: {
    type: Number,
    required: true,
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
    type: Schema.Types.ObjectId,
    ref: 'ArtifactSet'
  }
},
{timestamps: true});

export default mongoose.model('Artifact', artifactSchema);
