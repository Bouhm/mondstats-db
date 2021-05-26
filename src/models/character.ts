import mongoose, { Schema } from 'mongoose';

const characterSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  constellations: [{
    type: Schema.Types.ObjectId,
    ref: 'Constellation'
  }],
  element: {
    type: String
  },
  level: {
    type: Number
  },
  fetter: {
    type: Number
  },
  weapon: {
    type: Schema.Types.ObjectId,
    ref: 'Weapon'
  },
  artifactSets: [{
    type: Schema.Types.ObjectId,
    ref: 'ArtifactSet'
  }]
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
