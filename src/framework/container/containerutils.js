"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../../");
var getcomponentmeta_1 = require("./getcomponentmeta");
var TAG = "CONTAINER_UTILS";
var debug = require("debug")("bind:container");
/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
function addSingletonComponent(container, clazz) {
    var meta = getcomponentmeta_1.getComponentMeta(clazz);
    debug(TAG, "Adding singleton component=", meta.identity.componentName);
    /**
     * Return a function that has closer-based singleton instance
     * @type {(ctnr: IfIocContainer<T>, ctx?: T) => (any | IfComponentPropDependency)}
     */
    var getter = function (componentMeta) {
        var name = componentMeta.identity.componentName;
        var instance;
        /**
         * Getter of Singleton component
         * does not take context as second param
         */
        return function (ctnr) {
            debug(TAG, "Getter called for Singleton component=", name);
            if (instance) {
                debug(TAG, "Returning same instance of component=", name);
                return instance;
            }
            debug(TAG, "Creating new instance of component' ", name, "' with constructor args", componentMeta.constructorDependencies);
            var constructorArgs = componentMeta.constructorDependencies.map(function (_) { return ctnr.getComponent(_.dependency.componentName); });
            //instance = new clazz(...constructorArgs);
            instance = Reflect.construct(clazz, constructorArgs);
            debug(TAG, "Adding dependencies to component' ", name, "' ", componentMeta.propDependencies);
            /**
             * Have instance object
             * now set properties with prop dependency instances
             *
             * The instance that was set via close will get its props set
             * and will also be returned
             */
            return componentMeta.propDependencies.reduce(function (prev, curr) {
                prev[curr.propertyName] = ctnr.getComponent(curr.dependency.componentName);
                return prev;
            }, instance);
        };
    }(meta);
    var component = __assign({}, meta, { get: getter });
    container.addComponent(component);
}
exports.addSingletonComponent = addSingletonComponent;
function addContextComponent(container, clazz) {
    var meta = getcomponentmeta_1.getComponentMeta(clazz);
    debug(TAG, "Adding singleton component=", meta.identity.componentName);
    var getter = function (ctnr, ctx) {
        /**
         * Look in ctx first if found return it
         * otherwise create new one using deps from ctnr and ctx
         * and set result in ctx.components
         */
    };
    var component = __assign({}, meta, { get: getter });
    container.addComponent(component);
}
exports.addContextComponent = addContextComponent;
/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
function addPrototypeComponent(container, clazz) {
    var componentMeta = getcomponentmeta_1.getComponentMeta(clazz);
    debug(TAG, "Adding prototype component=", componentMeta.identity.componentName);
    var getter = function (ctnr, ctx) {
        var name = componentMeta.identity.componentName;
        debug(TAG, "Creating new instance of component' ", name, "' with constructor args", componentMeta.constructorDependencies, " with ctx=", !!ctx);
        var constructorArgs = componentMeta.constructorDependencies.map(function (_) { return ctnr.getComponent(_.dependency.componentName, ctx); });
        var instance = Reflect.construct(clazz, constructorArgs);
        debug(TAG, "Adding dependencies to component' ", name, "' ", componentMeta.propDependencies);
        return componentMeta.propDependencies.reduce(function (prev, curr) {
            prev[curr.propertyName] = ctnr.getComponent(curr.dependency.componentName, ctx);
            return prev;
        }, instance);
    };
    var component = __assign({}, componentMeta, { get: getter });
    container.addComponent(component);
}
exports.addPrototypeComponent = addPrototypeComponent;
/**
 *
 * @param {IfIocContainer<T>} container
 * @param {ObjectConstructor} clazz
 */
function addFactoryComponent(container, clazz) {
    /**
     * Then create a component for every factory method,
     * create getter function for it
     * and add it to container
     */
    var componentMeta = getcomponentmeta_1.getComponentMeta(clazz);
    debug(TAG, "Adding Factory component=", componentMeta.identity.componentName);
    addSingletonComponent(container, clazz);
    /**
     * First add the factory component itself to container
     */
    if (componentMeta.provides.length === 0) {
        throw new TypeError("Factory component " + componentMeta.identity.componentName + " is not providing any components");
    }
    componentMeta.provides.reduce(function (prev, curr) {
        var providedComponent = {
            identity: curr.providesComponent,
            componentType: _1.IocComponentType.COMPONENT,
            scope: _1.IocComponentScope.SINGLETON,
            propDependencies: [],
            constructorDependencies: [],
            provides: []
        };
        var getter = function (factoryName, factoryMethodName, componentName) {
            var instance;
            return function (ctnr, ctx) {
                debug(TAG, "Getter called on Factory-Provided component=", componentName, " of factory=", factoryName);
                if (instance) {
                    debug(TAG, "Factory-Provided component=", componentName, " already created. Returning same instance");
                    return instance;
                }
                /**
                 * Factory Component is always singleton? Yes for now
                 * but not sure if there is any possibility to have ContextScoped factory
                 * Maybe in the future there could be a SessionScoped factory, then
                 * we will have to pass ctx param since it will contain means to get
                 * session-scoped objects
                 * @type {any}
                 */
                var factory = ctnr.getComponent(factoryName, ctx);
                debug(TAG, "Calling factory method=", factoryMethodName, " of factory=", factoryName);
                instance = factory[factoryMethodName]();
                return instance;
            };
        }(componentMeta.identity.componentName, curr.methodName, curr.providesComponent.componentName);
        var component = __assign({}, providedComponent, { get: getter });
        debug(TAG, "Adding factory-provided component=", component.identity.componentName);
        prev.addComponent(component);
        return prev;
    }, container);
}
exports.addFactoryComponent = addFactoryComponent;
function addComponent(container, clazz) {
    var meta = getcomponentmeta_1.getComponentMeta(clazz);
    if (meta.componentType === _1.IocComponentType.FACTORY) {
        return addFactoryComponent(container, clazz);
    }
    else if (meta.scope === _1.IocComponentScope.SINGLETON) {
        return addSingletonComponent(container, clazz);
    }
    else if (meta.scope === _1.IocComponentScope.NEWINSTANCE) {
        return addPrototypeComponent(container, clazz);
    }
    else {
        throw new TypeError("Unable to add component. " + JSON.stringify(meta));
    }
}
exports.addComponent = addComponent;
