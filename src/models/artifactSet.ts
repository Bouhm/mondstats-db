import mongoose, { Schema } from 'mongoose';

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
