import { gql } from 'apollo-server';

const schema = gql`
  type Character {

  }

  type Query {
    characters: [Character]!
  }
`;

export default schema