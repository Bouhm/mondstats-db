import _ from 'lodash';

import { IAffix } from '../seeds/interfaces';

export function getServerFromUid(uid: number) {
  switch (('' + uid)[0]) {
    case '1':
      return 'cn';
    case '6':
      return 'usa';
    case '7':
      return 'euro';
    case '8':
      return 'asia';
    default:
      return 'usa';
  }
}

export function getActivationNumber(count: number, affixes: IAffix[]) {
  const activations = _.map(affixes, (effect) => effect.activation_number);

  let activation = 0;
  _.map(activations, (activation_num) => {
    if (count >= activation_num) {
      activation = activation_num as number;
    }
  });

  return activation;
}
