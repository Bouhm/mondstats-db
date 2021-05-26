import mongoose, { Schema } from 'mongoose';

const constellationSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  effect: {
    type: String
  },
  is_actived: {
    type: Boolean
  },
  pos: {
    type: Number
  }
},
{timestamps: true});

export default mongoose.model('Constellation', constellationSchema);
