import { getOrElse, isDefined, Maybe } from '../types';

describe('Test of Maybe type', () => {
  test('isDefined should return true for non-empty value', () => {
    const obj1: Maybe<Object> = { ok: 1 };
    const res = isDefined(obj1);

    expect(res).toEqual(true);
  });

  test('isDefined should return false for null value', () => {
    const obj1: Maybe<Object> = null;
    const res = isDefined(obj1);

    expect(res).toEqual(false);
  });

  test('isDefined should return false for undefined value', () => {
    const obj1: Maybe<Object> = undefined;
    const res = isDefined(obj1);

    expect(res).toEqual(false);
  });

  test('isDefined should return true for empty string', () => {
    const obj1: Maybe<string> = '';
    const res = isDefined(obj1);

    expect(res).toEqual(true);
  });

  test('getOrElse should return object when object is defined', () => {
    const obj1: Maybe<Object> = { ok: 1 };
    const res = getOrElse(obj1, 'ok');

    expect(res).toEqual({ ok: 1 });
  });

  test('getOrElse should return default value when object is not defined', () => {
    const obj1: Maybe<Object> = null;
    const res = getOrElse(obj1, 'ok');

    expect(res).toEqual('ok');
  });
});
