import { getFilenamesRecursive } from '../index';

describe('Testing getFileNamesRecursive', () => {
  test('should return names of files in directory', () => {
    const expected = [
      '/fixtures/components/component1.txt',
      '/fixtures/components/component2.txt',
      '/fixtures/components/subdir/component1.txt',
      '/fixtures/components/subdir/component2.txt',
      '/fixtures/components/subdir/subsubdir1/component1.txt',
      '/fixtures/components/subdir2/component1.txt',
      '/fixtures/components/subdir2/component2.txt',
    ];

    const dir = `${__dirname}/fixtures/components`;
    const files = getFilenamesRecursive([dir])
      .map(file => file.substring(__dirname.length))
      .sort();

    expect(files).toEqual(expected);
  });
});
