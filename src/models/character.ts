import mongoose, { Schema } from 'mongoose';

const characterSchema = new Schema({
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
  constellation: {
    required: true,
    type: Number,
  },
  level: {
    required: true,
    type: Number,
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
  }],
  player: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
