import mongoose, { Schema } from 'mongoose';

export interface IConstellation {
  effect: string,
  id: number,
  name: string, 
  pos: number,
  icon: string
}

export interface ICharacter {
  constellations: IConstellation[],
  element: string,
  id: number,
  name: number,
  rarity: number
}

const characterSchema = new Schema({
  constellations: [{
    effect: String,
    id: Number,
    name: String,
    pos: Number,
    icon: String
  }],
  element: {
    required: true,
    type: String
  },
  id: {
    required: true,
    type: Number,
    unique: true
  },
  name: {
    required: true,
    type: String
  },
  rarity: {
    required: true,
    type: Number
  },
  icon: {
    required: true, 
    type: String
  },
  image: {
    required: true, 
    type: String
  }
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
