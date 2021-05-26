import mongoose from 'mongoose';

import connectDb from '../util/connection';

connectDb();

// Name That Color (NTC) provides a list of named colors and approximate hues
// names contains a list of colors in the following format:
// ["17462E", "Zuccini", "Green"] with the hexcode, name, and shade, respectively
mongoose.connection.once('open', () => {

});
