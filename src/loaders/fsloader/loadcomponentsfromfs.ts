import * as path from 'path';
import * as fs from 'fs';
import { IfIocContainer, StringOrSymbol, StringToAny } from '../../definitions';
import { addComponent } from '../../framework/container/containerutils';
import FrameworkError from '../../exceptions/frameworkerror';
import getFilenamesRecursive from './getFilenamesRecursive';
import { COMPONENT_ENV, COMPONENT_IDENTITY } from '../../consts';
import getComponentName from '../../metadata/getcomponentname';

const TAG = 'LOAD_FROM_FS';

const debug = require('debug')('bind:loader');

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
  let id;
  /**
   * Must be wrapped in try/catch because Reflect.getMetadata will throw TypeError
   * if entry is not an object.
   * Since the module can export just about anything - string, number, etc.
   * This function may pass a non-object to Reflect.getMetadata and
   * therefore we need to be ready for exception here.
   */
  try {
    id = Reflect.getMetadata(COMPONENT_IDENTITY, entry[1]);
    debug('%s Component id="%s"', TAG, id);
  } catch {
    debug('%s Exception from Reflect.getMetadata on entry %o', TAG, entry[1]);
  }
  return !!id;
};

export const envFilter = (envName: string = 'NODE_ENV') => (compClass): boolean => {
  const ENV = (envName && process.env[envName]) || Symbol('process env prop');

  if (!compClass) {
    debug('%s envFilter no prototype in component class in module', TAG);
    return false;
  }

  /**
   * Here using getPrototypeOf instead of .prototype because
   * an object may have __proto__ but no .prototype
   */
  if (!Object.prototype.hasOwnProperty.call(compClass, 'prototype') || !compClass.prototype) {
    debug('%s envFilter passed in class has no prototype', TAG);
    return false;
  }

  const proto = compClass.prototype;

  if (!Object.prototype.hasOwnProperty.call(proto, 'constructor')) {
    debug('%s no constructor in component in module', TAG);
    return false;
  }

  const compEnvs: Array<StringOrSymbol> = Reflect.getMetadata(COMPONENT_ENV, compClass);
  if (compEnvs) {
    debug(
      '%s COMPONENT "%s" has required values of process.env.%s %o ',
      TAG,
      compClass.name,
      envName,
      compEnvs,
    );

    if (!compEnvs.includes(ENV)) {
      debug(
        '%s Skipping loading component "%s" in environment %s. Expected environments=%o',
        TAG,
        compClass.name,
        ENV,
        compEnvs,
      );

      return false;
    }
  }

  return true;
};

/**
 * Check file name
 * If file path (including directories in its path)
 * has (/__)or not ends with .js then return false
 * Files that start with 2 underscores is the pattern of test files
 * and we don't want to auto-load test files since that can lead to application startup error
 * because it will load duplicate components.
 *
 * @param filePath string full path to file
 * @returns {boolean} true if file should be loaded by application loader
 */
export function isFileNameLoadable(filePath: string): boolean {
  /**
   * Special case to skip this check and allow all files to load
   * when env.LOADER_TEST is test to TEST
   * This way unit test can run and files can be loaded
   * from __tests__ dir
   */
  if (process?.env?.LOADER_TEST === 'TEST') return true;

  return !filePath.match(/\/__/) && path.extname(filePath) === '.js';
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

  const match = !!(fileContents && fileContents.match(/__decorate/));

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
  let myExports: StringToAny = {};

  try {
    // eslint-disable-next-line
    myExports = require(file);
  } catch (e) {
    /**
     * If Error came from one of the decorator functions
     * it will be of type FrameworkError
     * in which case we need to stop loading rest of the files
     * and rethrow it
     */
    if (e instanceof FrameworkError) {
      throw e;
    }
    throw new FrameworkError(
      `Failed at require file ${file}
    Error=${e.message}`,
      e,
    );
  }

  const ret = Object.entries(myExports);

  debug('%s getExportsFromFile() returning export for file "%s" exports="%O"', TAG, file, ret);

  return ret;
};

/**
 * @param container
 * @param dirs
 * @throws FrameworkError if component cannot be loaded or
 * cannot be added to container
 */
export const load = (
  container: IfIocContainer,
  dirs: string[],
  envFilterName: string = 'NODE_ENV',
): void => {
  const files = getFilenamesRecursive(dirs)
    .filter(isFileNameLoadable)
    .filter(fileContainsDecorators);

  debug('%s loading from files: %o', TAG, files);

  files.forEach(file => {
    let fileExports: Array<ObjectEntry>;
    let targetEntries: Array<ObjectEntry>;
    let components: Array<any>;

    try {
      fileExports = getExportsFromFile(file);
    } catch (e) {
      const error = `Failed to load components from file ${file}
      Caused by Error: ${e.message}`;

      throw new FrameworkError(error, e);
    }

    if (fileExports) {
      /**
       * Filter array of ObjectEntry to contain only ObjectEntry of Component
       * Now targetEntries is array of ObjectEntries where each ObjectEntry holds
       * a decorated component
       */
      targetEntries = fileExports.filter(isComponentEntry);
      components = targetEntries.map(entry => entry[1]).filter(envFilter(envFilterName));

      components.forEach(component => {
        debug(
          '%s Adding component className="%s" from file "%s"',
          TAG,
          String(getComponentName(component)),
          file,
        );

        try {
          addComponent(container, component);
        } catch (e) {
          const error = `Failed to add component ${String(getComponentName(component))} 
          to container from file ${file}
          Caused by Error: ${e.message}`;

          throw new FrameworkError(error, e);
        }
      });
    }
  });

  return undefined;
};
