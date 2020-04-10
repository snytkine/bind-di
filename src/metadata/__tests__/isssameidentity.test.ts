import { Identity } from '../../framework/identity';
import getComponentIdentity from '../getcomponentidentity';
import Logger from './fixtures/logger';
import MyLogger from './fixtures/mylogger';
import { isSameIdentity } from '../index';
import MyPlainClass from './fixtures/myplainclass';

describe('Test of function isSameIdentity', () => {
  test('should return true for 2 named identities with the same name', () => {
    const id1 = Identity('mylogger');
    const id2 = getComponentIdentity(Logger);

    const res = isSameIdentity(id1, id2);

    expect(res).toEqual(true);
  });

  test('should return false when first is named second is unnamed', () => {
    const id1 = getComponentIdentity(Logger);
    const id2 = getComponentIdentity(MyLogger);

    const res = isSameIdentity(id1, id2);

    expect(res).toEqual(false);
  });

  test('should return false when first is unnamed second is named', () => {
    const id1 = getComponentIdentity(MyLogger);
    const id2 = getComponentIdentity(Logger);

    const res = isSameIdentity(id1, id2);

    expect(res).toEqual(false);
  });

  test('should return true when both are unnamed but have same .clazz', () => {
    const id1 = getComponentIdentity(MyLogger);
    const id2 = Identity(MyLogger);

    const res = isSameIdentity(id1, id2);

    expect(res).toEqual(true);
  });

  test('should return false when both are unnamed with different .clazz', () => {
    const id1 = Identity(MyPlainClass);
    const id2 = Identity(MyLogger);

    const res = isSameIdentity(id1, id2);

    expect(res).toEqual(false);
  });
});
