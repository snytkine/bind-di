import { getFunctionParameters } from './getfunctionparameters';
import { FrameworkError } from '../../exceptions';

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
});
