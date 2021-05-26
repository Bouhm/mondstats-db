import mongoose, { Schema } from 'mongoose';

const artifactSetSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  affixes: [{
    activation_number: Number,
    effect: String
  }]
},
{timestamps: true});

export default mongoose.model('ArtifactSet', artifactSetSchema);
