import mongoose from 'mongoose';

import connectDb from '../util/connection';

connectDb();

mongoose.connection.once('open', () => {

});
