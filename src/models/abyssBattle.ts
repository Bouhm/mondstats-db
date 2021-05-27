import mongoose, { Schema } from 'mongoose';

const abyssBattleSchema = new Schema({
  battle: {
    required: true,
    type: Number
  },
  characters: [{
    ref: 'Character',
    required: true,
    type: Schema.Types.ObjectId
  }],
  floor: {
    required: true,
    type: Number
  },
  max_star: {
    type: Number
  },
  stage: {
    required: true,
    type: Number
  },
  star: {
    type: Number
  }
},
{timestamps: true});

export default mongoose.model('AbyssBattle', abyssBattleSchema);
