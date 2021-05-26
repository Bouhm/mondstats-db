import mongoose, { Schema } from 'mongoose';

const playerSchema = new Schema({
  uid: {
    required: true,
    type: Number,
    unique: true
  },
  clearedAbyss: {
    required: true,
    type: Boolean
  },
  characters: [{
    type: Schema.Types.ObjectId,
    ref: 'Character'
  }]
},
{timestamps: true});

export default mongoose.model('Player', playerSchema);
