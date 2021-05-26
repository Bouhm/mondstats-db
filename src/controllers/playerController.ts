import { NextFunction, Request, Response } from 'express';

import Player from '../models/player';

export const getPlayerCharacters = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Player.find().then((players: any[]) => {
    return res.status(200).json({ players });
  });
};