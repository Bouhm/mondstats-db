import Player from '../models/player';

const Query = {
  players: async () => {
    return await Player.find()
  }
}

export default Query
