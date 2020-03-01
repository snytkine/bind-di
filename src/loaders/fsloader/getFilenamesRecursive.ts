import * as fs from 'fs';
import * as path from 'path';

const debug = require('debug')('bind:loader');

const TAG = 'FILE_LOADER';

/**
 * Get array of paths to files in all sub-directories in the directory
 *
 * @param dirs array of directories to scan. Each value in array is a file system path to directory
 *
 * @returns Array<string> array of full paths to all files
 */
export default function getFilenamesRecursive(dirs: string[]): Array<string> {
  debug('%s Entered getFilenamesRecursive with dir %o', TAG);

  const getFilenamesRecursiveInner = (dir: string, aFiles: string[] = [], level = 0) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        // eslint-disable-next-line no-param-reassign
        aFiles = getFilenamesRecursiveInner(path.join(dir, file), aFiles, level + 1);
      } else {
        aFiles.push(path.join(dir, file));
      }
    });

    return aFiles;
  };

  return dirs.map(_ => getFilenamesRecursiveInner(_)).reduce((prev, cur) => prev.concat(cur), []);
}
