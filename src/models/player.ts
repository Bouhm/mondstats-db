import mongoose, { Schema } from 'mongoose';

const playerSchema = new Schema({
  uid: {
    type: Number,
    required: true,
    unique: true
  },
  characters: [{
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: true
  }],
  abyss: [{
    type: Schema.Types.ObjectId,
    ref: 'AbyssBattle',
    required: true
  }],
  max_floor: {
    type: String
  },
  total_star: {
    type: Number
  }
},
{timestamps: true});

export default mongoose.model('Player', playerSchema);
