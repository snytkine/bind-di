import { COMPONENT_ENV } from '../consts/symbols';
import { ComponentClassDecorator, Constructor } from '../definitions';
import { FrameworkError } from '../exceptions';

const debug = require('debug')('bind:decorators');

const TAG = '@Environment';

export default function Environment(...names: string[]): ComponentClassDecorator<any> {
  return function environmentDecorator(target: Constructor<any>) {
    debug('Entered %s decorator with class %s', TAG, target.name);
    /**
     * @todo use getTargetStereotype
     * from bind instead of manually determining type
     */
    const envs = Reflect.getMetadata(COMPONENT_ENV, target);
    if (envs) {
      throw new FrameworkError(
        `Cannot add ${TAG} annotation to Class ${
          target.name
        } because it is already annotated as ${envs.join(', ')}`,
      );
    }

    Reflect.defineMetadata(COMPONENT_ENV, names, target);
  };
}
