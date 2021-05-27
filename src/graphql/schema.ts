import { buildSchema } from 'graphql';

const schema = buildSchema(`
  type Character {
    id: String
  }

  type Query {
    characters: [Character]!
  }
`);

export default schema