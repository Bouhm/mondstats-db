import mongoose, { Schema } from 'mongoose';

const characterSchema = new Schema({
  artifactSets: [{
    ref: 'ArtifactSet',
    type: Schema.Types.ObjectId
  }],
  constellations: [{
    ref: 'Constellation',
    type: Schema.Types.ObjectId
  }],
  element: {
    type: String
  },
  fetter: {
    type: Number
  },
  id: {
    required: true,
    type: Number,
    unique: true
  },
  level: {
    type: Number
  },
  name: {
    type: String
  },
  weapon: {
    ref: 'Weapon',
    type: Schema.Types.ObjectId
  }
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
