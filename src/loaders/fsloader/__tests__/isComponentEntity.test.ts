import Client from './fixtures/client';
import Obj1 from './fixtures/obj1';
import { isComponentEntry } from '../loadcomponentsfromfs';

describe('test isComponentEntity', () => {
  test('isComponentEntity should return true for decorated class', () => {
    expect(isComponentEntry(['component', Client])).toEqual(true);
  });

  test('isComponentEntity should return false for non-decorated class', () => {
    expect(isComponentEntry(['component', Obj1])).toEqual(false);
  });
});
