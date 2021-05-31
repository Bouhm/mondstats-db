import PlayerCharacter from '../models/playerCharacter';
import Weapon from '../models/weapon';
import Artifact from '../models/artifact';
import AbyssBattle from '../models/abyssBattle';
import Character from '../models/character';
import playerCharacter from '../models/playerCharacter';

export const resolvers = {
    Query: {
      async getPlayerCharacter(id: number) {
        return await playerCharacter.findOne({ id })
      },
      async allAbyssBattles() {
        return await AbyssBattle.find();
      },
      async allWeapons() {
        return await Weapon.find();
      },
      async allArtifacts() {
        return await Artifact.find();
      },
      async allCharacters() {
        return await Character.find();
      }
    }
};
