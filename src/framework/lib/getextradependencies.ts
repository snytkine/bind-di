import { EXTRA_DEPENDENCIES } from '../../consts';
import getComponentName from '../../metadata/getcomponentname';
import { ComponentIdentity } from '../../utils/componentidentity';
import { Target } from '../../definitions/target';
import getTargetStereotype from './gettargetstereotype';
import { TargetStereoType } from '../../enums';

const debug = require('debug')('bind:decorator:lifecycle');

const TAG = 'getExtraDependencies';

export default function getExtraDependencies(target: Target): Array<ComponentIdentity> {
  const targetStereotype = getTargetStereotype(target);
  const cName = String(getComponentName(target));
  debug('%s Entered getExtraDependencies for target="%s"', TAG, cName);

  let dependencies: Array<ComponentIdentity> =
    Reflect.getMetadata(EXTRA_DEPENDENCIES, target) || [];

  /**
   * Individual method may have own dependencies
   * @todo do not check if target.prototype because it will be true even for class
   * because it will dig this property from prototype chain.
   * Instead use const targetStereotype = getTargetStereotype(target);
   */
  if (targetStereotype === TargetStereoType.CONSTRUCTOR) {
    /**
     * Here using for-in loop will not work because it
     * iterates only over enumerable properties
     * but methods of class are not enumerable
     * so must use getOwnPropertyNames
     * Implication of this is that keys will NOT have properties
     * from parent class in case of class inheritance.
     * But this is an expected behaviour. An extra dependencies
     * added to method are set specifically for that class and not expected
     * to also be extra dependencies of potential child class.
     */
    const keys = Object.getOwnPropertyNames(target.prototype).filter(
      prop => prop !== 'constructor',
    );
    debug('%s target keys=%o', TAG, keys);

    for (const p of keys) {
      debug('%s Checking for prop dependency. prop "%s.%s"', TAG, cName, p);

      const deps: Array<ComponentIdentity> = Reflect.getMetadata(
        EXTRA_DEPENDENCIES,
        target.prototype,
        p,
      );

      /**
       * dependency may already exist for the same property key if it was
       * defined on the parent class.
       *
       */
      if (deps) {
        debug('%s Prop "%s.%s" has extra dependencies', TAG, cName, p);
        dependencies = dependencies.concat(deps);
      } else {
        debug('%s Prop "%s.%s" has NO extra dependencies', TAG, cName, p);
      }
    }
  }

  /**
   * @todo remove duplicates from dependencies array using isSameIdentity
   */
  debug('%s returning prop dependencies for class "%s" dependencies=%o', TAG, cName, dependencies);

  return dependencies;
}
