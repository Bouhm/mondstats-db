import mongoose, { Schema } from 'mongoose';

export interface IConstellation {
  effect: string,
  id: number,
  is_actived?: boolean,
  name: string, 
  pos: number
}

const constellationSchema = new Schema({
  effect: {
    type: String
  },
  id: {
    required: true,
    type: Number,
    unique: true
  },
  is_actived: {
    type: Boolean
  },
  name: {
    type: String
  },
  pos: {
    type: Number
  }
},
{timestamps: true});

export default mongoose.model('Constellation', constellationSchema);
