import { getFunctionParameters, getMethodParamName } from '../getfunctionparameters';
import { FrameworkError } from '../../../exceptions';

class Storage {
  private id: 123;

  private category: 'test';

  public connection = true;

  public getItem(name: string, idn: number) {
    return {
      name,
      idn,
      id: this.id,
      category: this.category,
    };
  }
}

describe('Test of getFunctionParameters and getMethodParamName', () => {
  test('should throw if input not a function', () => {
    let error;
    const input: unknown = 'my func';

    try {
      getFunctionParameters(input as Function);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('should return array of function parameters', () => {
    const f = function f1(name: string, title: string, idsb?: number) {
      return `${name} ${title} ${idsb}`;
    };

    const res = getFunctionParameters(f);
    expect(res).toEqual(['name', 'title', 'idsb']);
  });

  test(`getMethodParamName should throw if regex fails, like in case when
  passed in Function in a Class`, () => {
    let error;

    try {
      getFunctionParameters(Storage);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
    expect(error.message.includes('Error extracting function parameters from function')).toEqual(
      true,
    );
  });

  test('getMethodParamName should return name of param', () => {
    const res0 = getMethodParamName(Storage.prototype, 'getItem', 0);
    const res1 = getMethodParamName(Storage.prototype, 'getItem', 1);
    expect(res0).toEqual('name');
    expect(res1).toEqual('idn');
  });

  test('getMethodParamName should throw if methodName is not a function', () => {
    let error;

    try {
      getMethodParamName(Storage.prototype, 'connection', 0);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
  });

  test('getMethodParamName should throw if param not found by paramIndex', () => {
    let error;

    try {
      getMethodParamName(Storage.prototype, 'getItem', 2);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(FrameworkError);
  });
});
