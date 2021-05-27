import mongoose, { Schema } from 'mongoose';

const playerSchema = new Schema({
  abyss: [{
    ref: 'AbyssBattle',
    required: true,
    type: Schema.Types.ObjectId
  }],
  characters: [{
    ref: 'Character',
    required: true,
    type: Schema.Types.ObjectId
  }],
  max_floor: {
    type: String
  },
  total_star: {
    type: Number
  },
  uid: {
    required: true,
    type: Number,
    unique: true
  }
},
{timestamps: true});

export default mongoose.model('Player', playerSchema);
