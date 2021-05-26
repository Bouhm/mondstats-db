import mongoose, { Schema } from 'mongoose';

const playerSchema = new Schema({
  uid: {
    type: Number,
    required: true,
    unique: true
  },
  clearedAbyss: {
    type: Boolean,
    required: true
  },
  characters: [{
    type: Schema.Types.ObjectId,
    ref: 'Character'
  }]
},
{timestamps: true});

export default mongoose.model('Player', playerSchema);
