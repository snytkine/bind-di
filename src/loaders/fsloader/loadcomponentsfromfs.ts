import { IfIocContainer } from '../../definitions';
import { getClassName, getComponentName } from '../../metadata';
import { addComponent } from '../../framework/container';
import { FrameworkError } from '../../exceptions';
import {
    getFilenamesRecursive,
} from './getFilenamesRecursive';
import * as path from "path";
import * as fs from "fs";
import { COMPONENT_IDENTITY } from '../../consts';

const TAG = 'LOAD_FROM_FS';

const debug = require('debug')('bind:loader');

export type FileExports = {
    [key: string]: any
}

export type ObjectEntry = [string, any];

/**
 * Given ObjectEntry test to see if Object has been decorated
 * with @Component or other decorator that added COMPONENT_IDENTITY
 * metadata
 *
 * @param entry
 * @returns boolean true if Object in ObjectEntry has COMPONENT_IDENTITY
 */
export const isComponentEntry = (entry: ObjectEntry): boolean => {
    return !!Reflect.getMetadata(COMPONENT_IDENTITY, entry[1]);
};


/**
 * Check file name
 * If file path (including directories in its path)
 * starts with 2 underscore or not ends with .js then return false
 * Files that start with 2 underscores is the pattern of test files
 * and we don't want to auto-load test files since that can lead to application startup error
 * because it will load duplicate components.
 *
 * @param filePath string full path to file
 * @returns {boolean} true if file should be loaded by application loader
 */
export function isFileNameLoadable(filePath: string): boolean {

    return (!filePath.match(/'\/__'/)) && path.extname(filePath)==='.js';
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
export function fileContainsDecorators(filePath: string): boolean {

    const fileContents = fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf-8');

    let match = !!(fileContents && fileContents.match(/__decorate/));

    debug('%s fileContents of "%s" will be loaded="%s"', TAG, filePath, match);

    return match;

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
export const getExportsFromFile = (file: string): Array<ObjectEntry> => {
    let myExports:FileExports = {};

    try {
        const loaded = require.cache;

        myExports = require(file);

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

    const ret = Object.entries(myExports);

    debug('%s getExportsFromFile() returning export for file "%s" exports="%O"', TAG, file, ret);

    return ret;

};


export const load = (container: IfIocContainer, dirs: string[]) => {

    const files = getFilenamesRecursive(dirs)
            .filter(isFileNameLoadable)
            .filter(fileContainsDecorators);

    debug('%s loading from files: %s', TAG, JSON.stringify(files, null, '\t'));

    files.forEach(file => {
        const fileExports: Array<ObjectEntry> = getExportsFromFile(file);
        /**
         *
         * Filter array of ObjectEntry to contain only ObjectEntry of Component
         * Now targetEntries is array of ObjectEntries where each ObjectEntry holds
         * a decorated component
         */
        const targetEntries: Array<ObjectEntry> = fileExports.filter(isComponentEntry);
        const components = targetEntries.map(entry => entry[1]);

        components.forEach(component => {
            debug('%s Adding component className="%s" from file "%s"',
                    TAG,
                    getClassName,
                    file);
            try {
                addComponent(container, component);
            } catch (e) {
                const error = `Failed to load component ${String(getComponentName(component))} from file ${file}`;

                throw new FrameworkError(error, e);
            }
        });
    });

};
