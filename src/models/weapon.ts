import mongoose, { Schema } from 'mongoose';

const weaponSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: Number,
    required: true
  },
  type_name: {
    type: String,
    required: true
  },
  rarity: {
    type: Number,
    required: true
  },
  desc: {
    type: Number,
    required: true
  }
},
{timestamps: true});

export default mongoose.model('Weapon', weaponSchema);
