import mongoose from 'mongoose';

import connectDb from '../util/connection';
import { updateDb } from './aggregate';

(async () => {
  await connectDb();
  await updateDb();
  await mongoose.connection.close();
})();
