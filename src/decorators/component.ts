import "reflect-metadata";
import {
  _PROP_DEPENDENCIES_,
  _CTOR_DEPENDENCIES_,
  _COMPONENT_NAME_,
  _FACTORY_METHODS_,
  _COMPONENT_TYPE_,
  IfComponentFactoryMethod,
  IfComponentPropDependency,
  IocComponentType,
  IocComponentLifecycle
} from '../definitions'


const debug = require('debug')('bind:decorator:component');
const TAG = '@Component';


export type Target = {
  new (...args: any[]): any,
  name: string
}


export interface IfComponentDecoration {
  componentName: string
  componentType: IocComponentType
  target: Target
  componentMeta?: Symbol
  propertyKey?: string
  descriptor?: PropertyDescriptor
}


export interface IfComponentDetails {

  /**
   * Component name
   */
  id?: string

  /**
   * Unique identifier of component type
   */
  componentType?: IocComponentType


  /**
   * Optional field may be used by consumer of this framework
   * to add extra info to component.
   * Example is to add a hint that component is a Middleware or Controller, or RequestFilter
   * or any other info that consuming framework may need to set
   *
   * Default value is DEFAULT_COMPONENT_META
   *
   */
  componentMeta?: Symbol

  /**
   * Component lifecycle
   */
  lifecycle?: IocComponentLifecycle

  /**
   * Property dependencies
   */
  propDeps: Array<IfComponentPropDependency>

  /**
   * Constructor dependencies
   */
  ctorDeps: Array<string>

  /**
   * Array of componentIDs that this
   * component provides
   * I Component Factory may provide
   * multiple components
   */
  provides: Array<string>

}

/**
 * Get component metadata from class or object instance
 * @param target
 */
//export function getComponentMeta(target: any): IfComponentDetails {
//
//}

export const addComponentDecoration = (data: IfComponentDecoration): void => {

  if (typeof data.target === "function" && !data.propertyKey) {

    debug(`Defining @Component '${data.componentName}' for class ${data.target.name}`);

    Reflect.defineMetadata(_COMPONENT_NAME_, data.componentName, data.target);
    Reflect.defineMetadata(_COMPONENT_TYPE_, data.componentType, data.target);


  } else {


    /**
     * Component can also be added to function in case of ComponentFactory
     * where a function returns a component
     */
    if (typeof data.descriptor.value !== 'function') {
      throw new TypeError(`Only class or class method can have a '${TAG}' decorator. ${data.target.constructor.name}.${data.propertyKey} decorated with ${TAG}('${data.componentName}') is NOT a class or method`);
    }

    let components: Array<IfComponentFactoryMethod> = Reflect.getMetadata(_FACTORY_METHODS_, data.target);
    components = components || [];

    components.push({propName: data.propertyKey, provides: data.componentName});

    debug(`Adding _FACTORY_METHODS_ ${JSON.stringify(components)} of target ${data.target.constructor.name}`);

    Reflect.defineMetadata(_FACTORY_METHODS_, components, data.target);

  }

};


export function Component(target: Target, propertyKey?: string, descriptor?: PropertyDescriptor): void

export function Component(name: string): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => void

export function Component(nameOrTarget: string | Target) {
  let name: string;
  if (typeof nameOrTarget !== 'string') {
    debug(`${TAG} Component decorator Called without params`);
    name = nameOrTarget.name;
    debug(`${TAG} Name from target= ${name}`);

    const ctorDeps: Array<string> = Reflect.getMetadata(_CTOR_DEPENDENCIES_, nameOrTarget.prototype) || [];
    const propDeps: Array<IfComponentPropDependency> = Reflect.getMetadata(_PROP_DEPENDENCIES_, nameOrTarget.prototype) || [];

    propDeps.forEach(d => {
      if (d.componentName === name) {
        throw new ReferenceError(`${TAG} Circular dependency in component '${name}'.  Property '${d.propName}' depends on component with the same name`);
      }
    });

    //Reflect.defineMetadata(_COMPONENT_NAME_, name, nameOrTarget);

  } else {
    debug(`Component decorator Called with name ${nameOrTarget}`);
    name = nameOrTarget;
    return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
      let name = nameOrTarget;
      if (typeof target === "function" && !propertyKey) {

        debug(`Defining @Component '${name}' for class ${target.name}`);
        let type = Reflect.getMetadata(_COMPONENT_TYPE_, target);
        if (type) {
          throw new SyntaxError(`Cannot add ${TAG} annotation to Class ${target.name} because it is already annotated as ${IocComponentType[type]}`)
        }

        /**
         * None of dependencies can have same name as the component itself
         */
        let deps: Array<IfComponentPropDependency> = Reflect.getMetadata(_PROP_DEPENDENCIES_, target.prototype) || [];
        const ctorDeps: Array<string> = Reflect.getMetadata(_CTOR_DEPENDENCIES_, target.prototype) || [];
        deps.forEach(d => {
          if (d.componentName === name) {

            throw new ReferenceError(`${TAG} Circular dependency in component '${name}'.  Property '${d.propName}' depends on component with the same name`);

          }
        });

        if (ctorDeps.includes(name)) {
          throw new ReferenceError(`${TAG} Circular dependency in component '${name}'.  Constructor depends on component with the same name`);

        }

        Reflect.defineMetadata(_COMPONENT_TYPE_, IocComponentType.COMPONENT, target);
        Reflect.defineMetadata(_COMPONENT_NAME_, name, target);

      } else {
        throw new TypeError(`@Component can be applied only to a class. Cannot apply '${name}' Component annotation`);
      }

    }
  }
}