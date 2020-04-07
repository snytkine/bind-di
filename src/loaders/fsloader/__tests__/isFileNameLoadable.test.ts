import { isFileNameLoadable } from '../loadcomponentsfromfs';

describe('#isFileNameLoadable test', () => {
  test('isFileNameLoadable should return true if file does not have /__', () => {
    const testFile = '/usr/local/project/component/component1.js';
    const res = isFileNameLoadable(testFile);

    expect(res).toEqual(true);
  });

  test('isFileNameLoadable should return false if file has /__', () => {
    const testFile = '/usr/local/__project/component/component1.js';
    const res = isFileNameLoadable(testFile);

    expect(res).toEqual(false);
  });

  test('isFileNameLoadable should return false if file does not end with .js', () => {
    const testFile = '/usr/local/project/component/component1.json';
    const res = isFileNameLoadable(testFile);

    expect(res).toEqual(false);
  });
});
