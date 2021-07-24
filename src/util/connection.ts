import dotenv from 'dotenv';
import mongo from 'mongodb';
import mongoose from 'mongoose';

dotenv.config();
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`;
<<<<<<< HEAD
const connectDb = () => {
  mongoose.set('useCreateIndex', true);
  mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
}
=======

const connectDb = async () => {
  mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
};
>>>>>>> seed

export default connectDb;
