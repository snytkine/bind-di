import { IfComponentIdentity, Target } from '../../definitions';
import { EXTRA_DEPENDENCIES, PROP_DEPENDENCY } from '../../consts';
import getComponentName from '../../metadata/getcomponentname';

const debug = require('debug')('bind:decorator:lifecycle');

const TAG = 'getExtraDependencies';

export default function getExtraDependencies(target: Target): Array<IfComponentIdentity> {
  const cName = String(getComponentName(target));
  debug('%s Entered getPropDependencies for target="%s"', TAG, cName);

  let dependencies = Reflect.getMetadata(EXTRA_DEPENDENCIES, target) || [];
  let keys = [];
  if (target && target.prototype) {
    keys = Object.getOwnPropertyNames(target.prototype).filter(prop => prop !== 'constructor');
  }

  /**
   * Individual method may have own dependencies
   */
  for (const p of keys) {
    debug('%s Checking for prop dependency. prop "%s.%s"', TAG, cName, p);

    /**
     * First check if class has own property p
     */
    if (Reflect.hasMetadata(EXTRA_DEPENDENCIES, target.prototype, p)) {
      const deps = Reflect.getMetadata(PROP_DEPENDENCY, target.prototype, p);
      debug('%s Prop "%s.%s" has extra dependencies', TAG, cName, p);
      /**
       * dependency may already exist for the same property key if it was
       * defined on the parent class.
       *
       */
      dependencies = dependencies.concat(deps);
    } else {
      debug('%s Prop "%s.%s" has NO dependency', TAG, cName, p);
    }
  }

  debug('%s returning prop dependencies for class "%s" dependencies=%o', TAG, cName, dependencies);

  return dependencies;
}
