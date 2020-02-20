##FEATURES
- Component decorator can be named or unnamed
- No limit on number of exported components per file.

## Release strategy
- Leave annotation case validation for later. Just leave 
minimal validation. Do not validate that factory must be singleton, etc
- Leave dealing with annotations behaviour in subclasses for later.
- Only annotated components will be parsed. The idea of parsing
unannotated componets is not a good one.

###TODOS
- Don't allow @Inject on whole class. Instead add function to 
check for possible constructor dependencies when adding @Component decorator
This will simplify @Inject function and will reduce noise because
will no longer need to add @Component and @Inject together.
Logic for dealing with named constructor injection and constructor dependencies via
@Component - check if there are already constructor injections when applying
@Component decorator. If there are any then don't use dependency injection fron
processing the @Component decoration.
A more sophisticated way is to allow certain @Inject constructor props and leave off
some others to be backfilled by @Component constructor injection.
- Don't use @Factory decorator, just normal @Component can be a factory
- Allow @Inject as method param. In this case scope limitations will not apply.
- Do not's allow unannotated Components to be added to container.
Adding unannotated components can be problematic if container picks
up any exported members like functions and variables.
- Maybe try and limit unnecessary interfaces.
- Validate that only Singleton scoped components can have @Init and @PreDestroy
- Explore what is passed in module and require and if we can use these 
inside the @Component decorator to extract parent module's file path
- Regular component can also be a Factory component. This means the
factory component should be allowed to be named components.
- Instead of __COMPONENT_TYPE__ maybe the type of component 
can be an array? A regular component can also be a factory component
Is that a good idea? What about middleware and controllerMiddleware?
What about Service or Executer component? Do we even need an executor
component since the one-time execution of function can be made
inside the init() method.
- Will not use @Factory decorator, then just remove it.
