"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../../");
var debug = require('debug')('bind:container');
exports.TAG = "Container";
/**
 * Check that all components have a correcsponding component available
 * for all its' dependencies
 *
 * @param {Array<IfIocComponent<T>>} components
 */
var checkDependencies = function (components) {
    debug(exports.TAG, "entered checkDependencies");
    components.forEach(function (component, i, arr) {
        /**
         * Check constructor dependencies
         */
        component.constructorDependencies.forEach(function (dep) {
            var found = arr.find(function (_) { return _.identity.componentName === dep.dependency.componentName; });
            if (!found) {
                throw new ReferenceError("Component " + component.identity.componentName + " has unsatisfied constructor dependency \"" + dep.dependency.componentName + "\"");
            }
            if (dep.dependency.className && found.identity.className !== dep.dependency.className) {
                throw new ReferenceError("Component " + component.identity.componentName + " has constructor dependency \"" + dep.dependency.componentName + ":" + dep.dependency.className + "\" but dependency component has className=\"" + found.identity.className + "\"");
            }
            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new ReferenceError("Component \"" + component.identity.componentName + "\" has a scope " + _1.IocComponentScope[component.scope] + " but has constructor dependency on component \"" + found.identity.componentName + "\" with a smaller scope \"" + _1.IocComponentScope[found.scope] + "\"");
            }
        });
        /**
         * Check property dependencies
         */
        component.propDependencies.forEach(function (dep) {
            var found = arr.find(function (_) { return _.identity.componentName === dep.dependency.componentName; });
            if (!found) {
                throw new ReferenceError("Component \"" + component.identity.componentName + "\" has unsatisfied property dependency for propertyName=\"" + dep.propertyName + "\" dependency=\"" + dep.dependency.componentName + "\"");
            }
            if (dep.dependency.className && found.identity.className !== dep.dependency.className) {
                throw new ReferenceError("Component \"" + component.identity.componentName + "\" has property dependency \"" + dep.dependency.componentName + ":" + dep.dependency.className + "\" for propertyName=\"" + dep.propertyName + "\" but dependency component has className=\"" + found.identity.className + "\"");
            }
            /**
             * Smaller scope cannot be injected into broader scope
             * Most specific - prototype scoped component cannot be a dependency of a singleton
             */
            if (component.scope > found.scope) {
                throw new ReferenceError("Component \"" + component.identity.componentName + "\" has a scope \"" + _1.IocComponentScope[component.scope] + "\" but has property dependency for propertyName=\"" + dep.propertyName + "\" on component \"" + found.identity.componentName + "\" with a smaller scope \"" + _1.IocComponentScope[found.scope] + "\"");
            }
        });
    });
};
/**
 * Check that component does not have a chain of dependencies that loop back to self
 * An example of a loop: A depends on B, B depends on C, C depends on A
 * This type of loop cannot be allowed
 *
 * @param {Array<IfIocComponent<T>>} components
 */
var checkDependencyLoop = function (components) {
    var TAG = 'checkDependencyLoop';
    debug(TAG, "Entered checkDependencyLoop");
    /**
     * First, convert array of components into an array of simple
     * objects {id:componentName, dependencies: string[], visited: boolean}
     * dependencies will be an array of component names (strings) of all constructor
     * dependencies and property dependencies
     * The 'visited' flag is set when a child component has been checked.
     * This will reduce number of passes
     * because otherwise in a complex dependencies graph multiple components have dependencies on same components
     * and once we already check a child component on one pass we don't have to check it if we arrived to same
     * component via different path
     *
     * @type {{name: string; dependencies: string[], visited: boolean}[]}
     */
    var namedComponents = components.map(function (_) {
        return {
            name: _.identity.componentName,
            dependencies: _.constructorDependencies.map(function (cd) { return cd.dependency.componentName; }).concat(_.propDependencies.map(function (pd) { return pd.dependency.componentName; })),
            visited: false
        };
    });
    debug(TAG, "namedComponents: " + JSON.stringify(namedComponents));
    var check = function (component, parents) {
        if (parents === void 0) { parents = []; }
        debug(TAG, "Entered " + TAG + ".check with component " + component.name);
        if (component.visited) {
            debug(TAG, "Component " + component.name + " already visited");
            return;
        }
        if (parents.includes(component.name)) {
            throw new ReferenceError("Dependency Loop detected for component \"" + component.name + "\". Loop: " + parents.join(' -> ') + " -> " + component.name);
        }
        /**
         * For every child component name:
         * generate an array of child components
         * then run each child component through check (recurse to this function), but append
         * the name of 'this' component to array of parents.
         * After every child component check is done set the visited = true on that child
         * When this function is run recursively with a child component it is possible that
         * that component will have own child components and recursion repeats for each or child's children, and so on,
         * until the component with no children is found, at which point the recursion will
         * start to unwind.
         */
        component.dependencies
            .map(function (cname) { return namedComponents.find(function (_) { return _.name === cname; }); })
            .reduce(function (parents, child) {
            check(child, parents);
            child.visited = true;
            return parents;
        }, parents.concat(component.name));
    };
    for (var _i = 0, namedComponents_1 = namedComponents; _i < namedComponents_1.length; _i++) {
        var nc = namedComponents_1[_i];
        check(nc);
    }
};
var Container = /** @class */ (function () {
    function Container() {
        this.store_ = new Map();
    }
    Object.defineProperty(Container.prototype, "components", {
        get: function () {
            return Array.from(this.store_.values());
        },
        enumerable: true,
        configurable: true
    });
    Container.prototype.getComponentDetails = function (name) {
        debug(exports.TAG, "Entered Container.getComponentDetails Requesting component=", name);
        var ret = this.store_.get(name);
        if (!ret) {
            throw new ReferenceError("Container Component Not found by name=\"" + name + "\"");
        }
        return ret;
    };
    Container.prototype.getComponent = function (name, ctx) {
        debug(exports.TAG, "Entered Container.getComponent Requesting component=", name, " With ctx=", !!ctx);
        return this.getComponentDetails(name).get(this, ctx);
    };
    Container.prototype.getComponentByIdentity = function (id, ctx) {
    };
    Container.prototype.addComponent = function (component) {
        var name = component.identity.componentName;
        debug(exports.TAG, "Entered Container.addComponent with component name=", name);
        if (this.store_.has(component.identity.componentName)) {
            throw new ReferenceError("Container already has component with name=\"" + name + "\"");
        }
        this.store_.set(name, component);
        return true;
    };
    Container.prototype.initialize = function () {
        var components = this.components;
        checkDependencies(components);
        checkDependencyLoop(components);
        // @todo sort PostConstruct components in correct order and initialize them
        return Promise.resolve(this);
    };
    Container.prototype.cleanup = function () {
        var _this = this;
        var a = this.components
            .filter(function (_) { return !!_.preDestroy; })
            .map(function (_) {
            var obj = _.get(_this);
            var methodName = _.preDestroy;
            return obj[methodName]();
        });
        return Promise.all(a).then(function (_) { return true; });
    };
    Container.prototype.has = function (id) {
        return this.store_.has(id.componentName);
    };
    return Container;
}());
exports.Container = Container;
