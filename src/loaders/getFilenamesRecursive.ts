/**
 * Created by snytkind on 8/8/17.
 */
import * as fs from 'fs';
import * as path from 'path';
const debug = require('debug')('bind:loader');

/**
 * Get array of paths to files in all sub-directories in the directory
 * Only files from sub-directories are processed.
 *
 * @param dir path to parent directory. Files in that directory are ignored, scan starts in all
 * sub-directories
 *
 * @returns Array<string> array of full paths to all files
 */
export function getFilenamesRecursive(dir: string): Array<string> {

  debug(`Entered getFilenamesRecursive with dir ${dir}`);

  const getFilenamesRecursive_ = function (dir: string, aFiles: string[] = [], level = 0) {
    let files = fs.readdirSync(dir);
    files.forEach(function (file) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        aFiles = getFilenamesRecursive_(path.join(dir, file), aFiles, level + 1);
      }
      else {
        if (level > 0) {
          aFiles.push(path.join(dir, file));
        } else {
          debug(`SKIPPING FILE ${file} IN TOP-LEVEL DIRECTORY`);
        }
      }
    });
    return aFiles;
  };

  return getFilenamesRecursive_(dir);
}

