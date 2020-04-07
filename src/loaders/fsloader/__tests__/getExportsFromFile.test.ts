import { getExportsFromFile } from '../loadcomponentsfromfs';
import { FrameworkError } from '../../../exceptions';

describe('test getExportsFromFile', () => {
  test('should return 2 exported classes from one file', () => {
    const file = `${__dirname}/fixtures/teller.tjs`;
    const res = getExportsFromFile(file);
    expect(res.length).toEqual(2);
  });

  test('should return 1 exported class from file with default export', () => {
    const file = `${__dirname}/fixtures/defaultlogger.tjs`;
    const res = getExportsFromFile(file);
    expect(res.length).toEqual(1);
    expect(res[0][0]).toEqual('default');
  });

  test('should throw FrameworkError when require() for file fails', () => {
    const file = `${__dirname}/fixtures/mongo.tjs`;
    let res;
    try {
      getExportsFromFile(file);
    } catch (e) {
      res = e;
    }
    expect(res).toBeInstanceOf(FrameworkError);
  });
});
