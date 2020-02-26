/**
 * Created by snytkind on 8/8/17.
 */
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
export function getFilenamesRecursive(dirs: string[]): Array<string> {

    debug(`Entered getFilenamesRecursive with dir ${dirs.join(',')}`);

    const getFilenamesRecursive_ = function (dir: string, aFiles: string[] = [], level = 0) {
        let files = fs.readdirSync(dir);
        files.forEach(function (file) {
            if (fs.statSync(path.join(dir, file))
                    .isDirectory()) {
                aFiles = getFilenamesRecursive_(path.join(dir, file), aFiles, level + 1);
            } else {
                aFiles.push(path.join(dir, file));
            }

        });

        return aFiles;
    };

    return dirs.map(_ => getFilenamesRecursive_(_))
            .reduce((prev, cur) => prev.concat(cur), []);
}





