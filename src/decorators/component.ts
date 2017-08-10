/**
 * Created by snytkind on 8/9/17.
 */
import "reflect-metadata";
import {_PROP_DEPENDENCIES_, _CTOR_DEPENDENCIES_, _COMPONENT_NAME_} from '../definitions'
import {IfComponentPropDependency} from "../definitions/container";
const debug = require('debug')('bind:ioc');
const TAG = '@Component';

export type Target = {
  new (...args: any[]): any,
  name: string
}


export function Component(target: Target): void

export function Component(name: string): (target: Target) => void

export function Component(nameOrTarget: string | Target) {
  let name: string;
  if (typeof nameOrTarget !== 'string') {
    debug(`${TAG} Component decorator Called without params`);
    name = nameOrTarget.name;

    const ctorDeps: Array<string> = Reflect.getMetadata(_CTOR_DEPENDENCIES_, nameOrTarget.prototype) || [];
    const propDeps: Array<IfComponentPropDependency> = Reflect.getMetadata(_PROP_DEPENDENCIES_, nameOrTarget.prototype) || [];

    propDeps.forEach(d => {
      if (d.componentName === name) {
        throw new ReferenceError(`${TAG} Circular dependency in component '${name}'.  Property '${d.propName}' depends on component with the same name`);
      }
    });

    Reflect.defineMetadata(_COMPONENT_NAME_, name, nameOrTarget);

  } else {
    debug(`Component decorator Called with name ${nameOrTarget}`);
    name = nameOrTarget;
    return function (target: any, propertyKey?: string) {
      let name = nameOrTarget;
      if (typeof target === "function" && !propertyKey) {

        debug(`Defining @Component '${name}' for class ${target.name}`);
        let type = Reflect.getMetadata(SYM_COMPONENT_TYPE, target);
        if (type) {
          throw new SyntaxError(`Cannot add ${TAG} annotation to Class ${target.name} because it is already annotated as ${ComponentType[type]}`)
        }

        /**
         * Make sure that none of the dependency components have same name as this component
         * This would cause circular dependency that Container's one circular dependency check
         * will not catch.
         * We want to catch this type of error early before component is even added to container
         */
        let deps: Array<IComponentDependency>;
        deps = Reflect.getMetadata(SYM_COMPONENT_DEPENDENCIES, target.prototype);
        deps = deps || [];
        deps.forEach(d => {
          if (d.componentName === name) {
            throw new ReferenceError(`${TAG} Circular dependency in component '${name}'.  Property '${d.propName}' depends on component with the same name`);
          }
        });

        Reflect.defineMetadata(SYM_COMPONENT_TYPE, ComponentType.COMPONENT, target);
        Reflect.defineMetadata(SYM_COMPONENT_NAME, name, target);

      } else {
        throw new TypeError(`@Component can be applied only to a class. Cannot apply '${name}' Component annotation`);
      }

    }
  }
}