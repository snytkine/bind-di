import { isObject } from '../index';

describe('Test of isObject function', () => {
  test('should return true for plain object', () => {
    expect(isObject({})).toEqual(true);
  });

  test('should return false for null', () => {
    expect(isObject(null)).toEqual(false);
  });

  test('should return false for undefined', () => {
    expect(isObject(undefined)).toEqual(false);
  });

  test('should return true for array', () => {
    expect(isObject([])).toEqual(true);
  });

  test('should return false for number', () => {
    expect(isObject(1)).toEqual(false);
  });

  test('should return false for boolean', () => {
    expect(isObject(true)).toEqual(false);
  });

  test('should return false for double', () => {
    expect(isObject(1.5)).toEqual(false);
  });

  test('should return false for Nan', () => {
    expect(isObject(NaN)).toEqual(false);
  });

  test('should return false for string', () => {
    expect(isObject('1')).toEqual(false);
  });

  test('should return false for String object', () => {
    expect(isObject(String('1'))).toEqual(false);
  });

  test('should return false for Number object', () => {
    expect(isObject(Number(1))).toEqual(false);
  });

  test('should return true for Date object', () => {
    expect(isObject(new Date())).toEqual(true);
  });
});
