import mongoose, { Schema } from 'mongoose';

const weaponSchema = new Schema({
  desc: {
    type: Number
  },
  id: {
    required: true,
    type: Number,
    unique: true
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
