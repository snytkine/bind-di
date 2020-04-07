import { fileContainsDecorators } from '../loadcomponentsfromfs';

describe('test fileContainesDecorators', () => {
  test('should return true for logger file', () => {
    const testFile = `${__dirname}/fixtures/logger.tjs`;

    expect(fileContainsDecorators(testFile)).toEqual(true);
  });

  test('should return false for file without decorators', () => {
    const testFile = `${__dirname}/fixtures/notcomponent.tjs`;

    expect(fileContainsDecorators(testFile)).toEqual(false);
  });

  test('should return false for file that does not exist', () => {
    const testFile = `${__dirname}/fixtures/mynotcomponent.tjs`;

    expect(fileContainsDecorators(testFile)).toEqual(false);
  });
});
