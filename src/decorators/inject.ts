import {Target, DESIGN_TYPE, PARAM_TYPES} from "../"

const debug = require('debug')('bind:decorator:inject');
const TAG = "@Inject";
/**
 * @Inject decorator can be applied to class property or to constructor parameter
 * or to constructor method itself.
 *
 * If applied to constructor method itself then every parameter in constructor will be
 * injected
 */

export function Inject(target: Target): void

export function Inject(target: Target, propertyKey: string, parameterIndex?: number): void

export function Inject(name: string): (target: any, propertyKey?: string, parameterIndex?: number) => void

export function Inject(nameOrTarget: string | Target, propertyKey?: string, parameterIndex?: number) {
    let name: string;
    if (typeof nameOrTarget !== 'string') {
        // unnamed inject

        if(propertyKey){
            name = nameOrTarget.constructor.name;
            /**
             * Called on propertyKey of a class
             * Must have .constructor because the nameOrTarget must be a class in this case
             * parameterIndex must be undefined
             * @type {string}
             *
             * If applied to class method but NOT to a constructor:
             * nameOrTarget is an Object (has .constructor and .constructor.name
             * .propertyKey is the name of method
             * has parameterIndex
             */
            if(parameterIndex !== undefined){
                throw new TypeError(`${TAG} can only be applied to constructor function of class property. Was applied to method ${name}.${propertyKey} index ${parameterIndex}`)
            }

            debug(`${TAG} called on ${name}.${propertyKey}`);
            const rt = Reflect.getMetadata(DESIGN_TYPE, nameOrTarget, propertyKey); // rt is class Classname{}
            debug(TAG, "rt=", rt);
            /**
             * In case of unnamed Inject on a property the property must have a DESIGN_TYPE
             * and it must be an object that is itself a component
             * If its a decorated component then it will have a _COMPONENT_NAME_ metadata
             * But it may be non an annotated component in case if this component is not a regular class
             * but a component that is produced by a factory, in which case it does not have decorator at all
             *
             */
        } else {
            /**
             *
             * Applied to constructor function
             * In this case nameOrTarget is class (has .constructor and .constructor.name)
             * propertyKey is undefined
             * has parameterIndex
             */
            const rt = Reflect.getMetadata(DESIGN_TYPE, nameOrTarget); // rt is class Classname{}
            debug(TAG, "rt=", rt);
        }


        
    } else {
        debug(`${TAG} decorator Called with component name="${nameOrTarget}"`);
        name = nameOrTarget;
        return function (target: any, propertyKey?: string, parameterIndex?: number) {
            
        }
    }
}
