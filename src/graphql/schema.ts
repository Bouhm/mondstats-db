import { buildSchema } from 'graphql';

const schema = buildSchema(`
  type Character {
    id: Number!
    name: String!
      
  }
  type Query {
    characters: [Color!]!
    abyss:
  }
`)

export default schema