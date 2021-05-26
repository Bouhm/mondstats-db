import mongoose, { Schema } from 'mongoose';

const artifactSetSchema = new Schema({
  id: {
    required: true,
    type: Number,
    unique: true
  },
  name: {
    required: true,
    type: String,
    unique: true
  },
  affixes: [{
    activation_number: Number,
    effect: String
  }]
},
{timestamps: true});

export default mongoose.model('ArtifactSet', artifactSetSchema);
