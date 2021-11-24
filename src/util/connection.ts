import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
// const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority&socketTimeoutMS=3600000&connectTimeoutMS=3600000`;
const URI = `mongodb://127.0.0.1:27017/${process.env.DATABASE}`;

const connectDb = async () => {
  mongoose.connect(URI, {});
};

export default connectDb;
