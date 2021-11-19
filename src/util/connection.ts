import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority&socketTimeoutMS=3600000&connectTimeoutMS=3600000`;

const connectDb = async () => {
  mongoose.connect(URI, {});
};

export default connectDb;

// mongosh "mongodb+srv://cluster0.jvgf0.mongodb.net/favonius" --username ADMIN --password J6hEjYm7kiq9bYhx