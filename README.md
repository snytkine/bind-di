![Node.js CI](https://github.com/snytkine/bind/workflows/Node.js%20CI/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
# Bind
Modern JavaScript Dependency Injection Framework written in TypeScript


#### Check out the [Documentation website](https://snytkine.github.io/) for full documentation

## FEATURES
- 100% TypeScript
- 100% Decorator based configuration
- File system scan. Components are loaded from file system, based on @Component decorators.
No need for any configuration files.
- Decorator-based dependency injection via @Inject decorator
- Constructor-base, property-based and setter-based injections are supported
- Component store can be replaced at any time even in the running application
- Dependency validation during initialization phaze.
- Factory Component - components that can create and return other components
- Async methods postConstruct and preDestroy can be used to establish database connections or any 
other async operation needed for initialization.
- debugging messages with debug library.
- Support for Component Lifecycle Scoped - Singleton, NewInstance, Request, Session and custom Lifecycle scopes
