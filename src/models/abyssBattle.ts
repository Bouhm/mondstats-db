import mongoose, { Schema } from 'mongoose';

const abyssBattleSchema = new Schema({
  floor: {
    type: Number,
    required: true
  },
  stage: {
    type: Number,
    required: true
  },
  battle: {
    type: Number,
    required: true
  },
  max_star: {
    type: Number
  },
  star: {
    type: Number
  },
  characters: [{
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: true
  }]
},
{timestamps: true});

export default mongoose.model('AbyssBattle', abyssBattleSchema);
