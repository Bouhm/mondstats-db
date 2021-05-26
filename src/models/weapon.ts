import mongoose, { Schema } from 'mongoose';

const characterSchema = new Schema({
  id: {
    required: true,
    type: Number,
    unique: true
  },
  name: {
    required: true,
    type: String,
    unique: true
  },
  constellation: {
    required: true,
    type: Number,
  },
  level: {
    required: true,
    type: Number,
  },
  character: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }
},
{timestamps: true});

export default mongoose.model('Character', characterSchema);
