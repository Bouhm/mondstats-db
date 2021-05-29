import mongoose, { Schema } from 'mongoose';

export interface IWeapon {
  desc: string,
  id: number,
  name: string,
  rarity: number,
  type: number,
  type_name: string,
  icon: string
}

const weaponSchema = new Schema({
  desc: {
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
  type: {
    required: true,
    type: Number
  },
  type_name: {
    required: true,
    type: String
  },
  icon: {
    required: true, 
    type: String
  }
},
{timestamps: true});

export default mongoose.model('Weapon', weaponSchema);
