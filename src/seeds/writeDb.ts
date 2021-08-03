import mongoose from 'mongoose';

import connectDb from '../util/connection';
import { updateDb } from './dbUtils';

(async () => {
  connectDb();
  await updateDb();
  mongoose.connection.close();
})();
