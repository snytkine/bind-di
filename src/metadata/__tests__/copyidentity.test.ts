import MyPlainClass from './fixtures/myplainclass';
import { Identity } from '../../framework/identity';
import copyIdentity from '../copyidentity';
import { isSameIdentity } from '../index';

describe('Test of copyIdentity function', () => {
  test('copyIdentity should return new Identity with equal Identity for unnamed', () => {
    const id1 = Identity(MyPlainClass);
    const id2 = copyIdentity(id1);

    expect(id1 === id2).toEqual(false);
    expect(isSameIdentity(id1, id2)).toEqual(true);
  });
});
