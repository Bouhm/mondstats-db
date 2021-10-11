import genshindb from 'genshin-db';

const { attack, specialized } = genshindb.weapons('sac sword').stats(90);
console.log(Math.round(attack), Math.round(specialized * 1000) / 1000);
