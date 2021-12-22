import genshindb from 'genshin-db';
import { map } from 'lodash';

const names = genshindb.characters('names', { matchCategories: true });

const characters = map(names, (name) => genshindb.characters(name));
console.log(characters);