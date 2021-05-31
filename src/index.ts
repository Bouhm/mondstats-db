import cors from 'cors';
import express from 'express';
import graphqlHTTP from 'express-graphql';

import resolvers from './graphql/resolvers';
import schema from './graphql/schema';
import playerCharacterRoutes from './routes';
import connectDb from './util/connection';

const app = express();
app.use(cors());
app.use(
  '/graphql',
  graphqlHTTP({
    graphiql: true,
    rootValue: resolvers,
    schema
  })
);
app.use('/json', playerCharacterRoutes);

connectDb().then(() => app.listen(process.env.PORT || 8080));
