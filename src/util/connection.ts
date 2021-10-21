import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority&socketTimeoutMS=360000&connectTimeoutMS=360000`;

const connectDb = async () => {
  mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
};

export default connectDb;
