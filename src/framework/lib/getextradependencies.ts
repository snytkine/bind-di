import { EXTRA_DEPENDENCIES } from '../../consts';
import getComponentName from '../../metadata/getcomponentname';
import { ComponentIdentity } from '../../utils/componentidentity';
import { Target } from '../../definitions/target';

const debug = require('debug')('bind:decorator:lifecycle');

const TAG = 'getExtraDependencies';

export default function getExtraDependencies(target: Target): Array<ComponentIdentity> {
  const cName = String(getComponentName(target));
  debug('%s Entered getPropDependencies for target="%s"', TAG, cName);

  let dependencies: Array<ComponentIdentity> =
    Reflect.getMetadata(EXTRA_DEPENDENCIES, target) || [];

  /**
   * Individual method may have own dependencies
   */
  if (target && target.prototype) {
    /**
     * Here using for-in loop because we need to include
     * properties from parent classes as well as this class
     * This is required for EnvOverride decorator to work properly
     * because it creates a sub-class of actual component
     * Object.keys will not work because it returns only own properties
     */
    // eslint-disable-next-line guard-for-in
    for (const p in target.prototype) {
      debug('%s Checking for prop dependency. prop "%s.%s"', TAG, cName, p);

      if (Reflect.hasMetadata(EXTRA_DEPENDENCIES, target.prototype, p)) {
        const deps: Array<ComponentIdentity> = Reflect.getMetadata(
          EXTRA_DEPENDENCIES,
          target.prototype,
          p,
        );
        debug('%s Prop "%s.%s" has extra dependencies', TAG, cName, p);

        /**
         * dependency may already exist for the same property key if it was
         * defined on the parent class.
         *
         */
        if (deps) {
          dependencies = dependencies.concat(deps);
        } else {
          debug('%s Prop "%s.%s" has NO extra dependencies', TAG, cName, p);
        }
      } else {
        debug('%s Prop "%s.%s" has NO dependency', TAG, cName, p);
      }
    }
  }

  /**
   * @todo remove duplicates from dependencies array using isSameIdentity
   */
  debug('%s returning prop dependencies for class "%s" dependencies=%o', TAG, cName, dependencies);

  return dependencies;
}
