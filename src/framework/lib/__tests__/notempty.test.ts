import { isEmpty, notEmpty, arrayNotEmpty } from '../notempty';

describe('Test of isEmpty, notEmpty, arrayNotEmpty functions', () => {
  test('isEmpty should return true for null', () => {
    expect(isEmpty(null)).toEqual(true);
  });

  test('isEmpty should return true for undefined', () => {
    expect(isEmpty(undefined)).toEqual(true);
  });

  test('isEmpty should return true for empty string', () => {
    expect(isEmpty('')).toEqual(true);
  });

  test('isEmpty should return false for empty object', () => {
    expect(isEmpty({})).toEqual(false);
  });

  test('isEmpty should return false for empty array', () => {
    expect(isEmpty([])).toEqual(false);
  });

  test('notEmpty should return true for empty object', () => {
    expect(notEmpty({})).toEqual(true);
  });

  test('notEmpty should return true for empty array', () => {
    expect(notEmpty([])).toEqual(true);
  });

  test('arrayNotEmpty should return false for empty array', () => {
    expect(arrayNotEmpty([])).toEqual(false);
  });

  test('arrayNotEmpty should return false for non array', () => {
    const x: unknown = 'ok';
    expect(arrayNotEmpty(x as Array<string>)).toEqual(false);
  });

  test('arrayNotEmpty should return true for non empty array', () => {
    expect(arrayNotEmpty([0])).toEqual(true);
  });
});
