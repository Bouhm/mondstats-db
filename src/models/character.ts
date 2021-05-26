import mongoose, { Schema } from 'mongoose';

const characterSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  constellation: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  weapon: {
    type: Schema.Types.ObjectId,
    ref: 'Weapon',
    required: true 
  },
  artifactSets: [{
    type: Schema.Types.ObjectId,
    ref: 'ArtifactSet',
    required: true
  }]
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
