import mongoose, { Schema } from 'mongoose';

export interface IWeapon extends Document {
  desc: string,
  id: number,
  level?: number,
  name: string,
  rarity: number,
  type: number,
  type_name: string
}

const weaponSchema = new Schema({
  desc: {
    type: String
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
  rarity: {
    type: Number
  },
  type: {
    type: Number
  },
  type_name: {
    type: String
  }
},
{timestamps: true});

export default mongoose.model('Weapon', weaponSchema);
