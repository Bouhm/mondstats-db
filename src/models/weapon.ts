import mongoose, { Schema } from 'mongoose';

const weaponSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String
  },
  type: {
    type: Number
  },
  type_name: {
    type: String
  },
  rarity: {
    type: Number
  },
  desc: {
    type: Number
  }
},
{timestamps: true});

export default mongoose.model('Weapon', weaponSchema);
