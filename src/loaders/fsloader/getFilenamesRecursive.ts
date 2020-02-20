/**
 * Created by snytkind on 8/8/17.
 */
import * as fs from 'fs';
import * as path from 'path';
import { IfIocContainer } from '../../index';
import { addComponent } from '../../framework/container';

const debug = require('debug')('bind:loader');

const TAG = 'FILE_LOADER';

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
export const getExportsFromFile = (file: string) => {
    let exports = {};
    try {
        const loaded = require.cache;

        exports = require(file);
        debugger;
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

    debug('getExportsFromFile() returning export for file "%s" exports="%O"', file, exports);

    return exports;

};

/**
 * Check file name
 * If filename contains 2 underscore or not ends with .js then return false
 * We don't load files with 2 underscores because this is the pattern of test files
 * and we don't want to auto-load test files since that can lead to application startup error
 * because it will load duplicate components.
 *
 * @param f string full path to file
 * @returns {boolean} true if file should be loaded by application loader
 */
export function isFileNameLoadable(f: string): boolean {
    return (!f.startsWith('__')) && path.extname(f)==='.js';
}


/**
 * Check that file exists and that contents of file
 * contain one of the Component annotations.
 * At application load time it will be checking the javascript file
 * not the typescript file so we cannot check for any @Component or @Controller
 * instead must check for compiled version .Controller or .Middleware etc.
 * @todo We don't use it because we also parsing unannotated classes and will consider
 * injecting unannotated classes. If this proves to be a bad idea then we can use this filter
 * for loading only the files that contain at least one variance of component annotation,
 *
 * @param f string full path to file to check
 * @returns {boolean} true if file exists and contains one of the component annotations|false otherwise
 */
export function fileContainsComponent(f: string): boolean {

    const fileContents = fs.existsSync(f) && fs.readFileSync(f, 'utf-8');

    let match = !!(fileContents && fileContents.match(/__decorate/) && fileContents.match(/\.Middleware|\.Controller|\.Component|\.ControllerMiddleware|\.ErrorHandler|\.ContextService/));

    debug(TAG, 'fileContents of ', f, ' match component: ', match);

    return match;

}


export const load = (container: IfIocContainer, dirs: string[]) => {

    const files = getFilenamesRecursive(dirs)
            .filter(file => isFileNameLoadable(file));
    /**
     * @todo filter our only files that has __decorate, some files may be just util functions.
     */
    debug(`${TAG}, loading from files: ${JSON.stringify(files, null, '\t')}`);

    files.map(file => {
        const fileexports = getExportsFromFile(file);

        for (const fe in fileexports) {
            try {
                /**
                 * Filter by name?
                 */
                /**
                 * @todo not all exports may be the actual Components
                 * Must check that export is a class with at least one @Component decorator
                 * do something like if(isComponent(fileexports[fe]) addComponent else debug('not a component')
                 */
                debug(`Adding export ${fe} from file ${file}`);

                /**
                 * The class in fileexports[fe] already had @Component decorator applied to it
                 * so it will already have Identity set on it.
                 *
                 */
                addComponent(container, fileexports[fe]);
            } catch (e) {
                /**
                 * Here we know the export name and filename where it came from
                 */
                debug(`Failed to load component from file ${file}. Error=${e.message}`);
                throw e;

            }
        }
    });

};

