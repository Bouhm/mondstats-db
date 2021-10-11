import fs from 'fs';
import { map } from 'lodash';
import mongoose from 'mongoose';
import { cleanup } from 'src/util';

import connectDb from '../util/connection';
import { updateRepo } from './githubApi';
import { aggregateDb } from './writeDb';
import { aggregateFeatured } from './writeFeatured';
import { aggregateStats } from './writeStats';

(async () => {
  await connectDb();

  const dirs = ['characters', 'artifacts', 'weapons', 'abyss'];

  if (!fs.existsSync('data')) {
    fs.mkdir('data', { recursive: true }, (e) => e);
  }

  await Promise.all(
    map(dirs, (dir) => {
      if (!fs.existsSync(`data/${dir}`)) {
        return fs.mkdir(`data/${dir}`, { recursive: true }, (e) => e);
      }
    }),
  );

  await Promise.all(
    map(dirs, (dir) => {
      if (!fs.existsSync(`data/${dir}/stats`)) {
        return fs.mkdir(`data/${dir}/stats`, { recursive: true }, (e) => e);
      }
    }),
  );

  if (!fs.existsSync(`data/characters/mains`)) {
    fs.mkdir(`data/characters/mains`, { recursive: true }, (e) => e);
  }

  try {
    await aggregateDb();
    await aggregateStats();
    await aggregateFeatured();
  } catch (err) {
    console.log(err);
  } finally {
    await updateRepo(process.env.npm_config_branch || 'main');
    cleanup('data');
  }

  await mongoose.connection.close();
})();
