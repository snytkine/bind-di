/**
 * Created by snytkind on 8/8/17.
 */
import * as fs from "fs";
import * as path from "path";

const debug = require("debug")("bind:loader");

const TAG = "FILE_LOADER";

export type FileExports = {
    [key: string]: any
}

/**
 * Get array of paths to files in all sub-directories in the directory
 *
 * @param dirs array of directories to scan. Each value in array is a file system path to directory
 *
 * @returns Array<string> array of full paths to all files
 */
export function getFilenamesRecursive(dirs: string[]): Array<string> {

    debug(`Entered getFilenamesRecursive with dir ${dirs.join(",")}`);

    const getFilenamesRecursive_ = function (dir: string, aFiles: string[] = [], level = 0) {
        let files = fs.readdirSync(dir);
        files.forEach(function (file) {
            if (fs.statSync(path.join(dir, file))
                .isDirectory()) {
                aFiles = getFilenamesRecursive_(path.join(dir, file), aFiles, level + 1);
            }
            else {
                aFiles.push(path.join(dir, file));
            }

        });

        return aFiles;
    };

    return dirs.map(_ => getFilenamesRecursive_(_))
    .reduce((prev, cur) => prev.concat(cur), []);
}

/**
 *
 * @param {string} file must be full path to js file to load
 * @returns {{file, exports}} Object with 2 keys: file - path to file
 * and 'exports' which is an object where keys are exported functions/variables and values are definitions
 * similar to this structure:
 *{ file: '/Users/snytkind/projects/bind/build/sandbox/func1',
 * exports:
 *  { plusOne: [Function],
 *    square: [Function: square],
 *    print: [Function: print],
 *    plusTwo: [Function],
 *    default: [Function: Song] } }
 *
 */
export const getExportsFromFile = (file: string): FileExports => {
    let exports = {};
    try {
        exports = require(file);
    } catch (e) {
        /**
         * If Error came from one of the decorator functions it will have
         * SyntaxError, ReferenceError or TypeError, in which case we need to stop loading rest of the files
         * and rethrow it
         */
        if (e instanceof ReferenceError || e instanceof TypeError) {
            throw e;
        }
        console.error(`${TAG} failed to require file '${file}' error: ${e}`);
    }

    return {
        file,
        exports
    };
};


export const load = (dirs: string[]) => {

    const files = getFilenamesRecursive(dirs);
    debug(`${TAG}, loading from files: ${JSON.stringify(files)}`);

    files.map(file => {
        const exports = getExportsFromFile(file);
        for (const name in exports) {
            try {
                /**
                 * Filter by name?
                 */
            } catch (e) {
                /**
                 * Here we know the export name and filename where it came from
                 */

            }
        }
    });

};

