import 'reflect-metadata'
import {
    Component,
    _COMPONENT_IDENTITY_,
    _COMPONENT_TYPE_,
    _DEFAULT_SCOPE_,
    Singleton,
    Scope,
    getComponentIdentity,
    Factory,
    getConstructorDependencies,
    Inject,
    getScope,
    IocComponentScope,
    PostConstruct,
    PreDestroy
} from '../'
import {Person as ThePerson, IfPerson} from './person'
import {getFactoryMethods} from "../decorators/factory";
import {getPropDependencies} from "../decorators/inject";


@Component
//@Scope(IocComponentScope.PROTOTYPE)
export class MyComponent {

    constructor(private settings: any) {

    }

    getUsername() {
        return "John"
    }

    @PostConstruct
    initialize() {
        return Promise.resolve(true)
    }

    @PreDestroy
    cleanup() {
        return Promise.resolve(true)
    }
}


//@Component("CHEEZE")
//@Singleton
@Factory
export class MyComponent2 {

    //@Component
    lastName: String = "Smith";

    //@Inject
    description: ThePerson;

    @Inject
    comp1: MyComponent;


    constructor(@Inject("LOL") settings: MyComponent, @Inject person: ThePerson, bla: string, age: number = 1, update: boolean = true) {
        //this.description = {first: "John", last: "Smith"}
    }

    @Component
    MyComponent2_getUsername(gsx: any): ThePerson {
        return new ThePerson("John", "Smith")
    }

    @Component("lastname")
    MyComponent2_getLastName() {
        return new ThePerson("", "LastName")
    }

    //@Component
    get config(): ThePerson {
        return this.description
    }
}


//let o = new MyComponent("HELLO");
//let n = o.getUsername();

let o2 = new MyComponent2(new MyComponent("OK"), new ThePerson("HELLO", "SMITY"), "Smith");
let n2 = o2.MyComponent2_getUsername("YES");
let o2type = Reflect.getMetadata(_COMPONENT_TYPE_, o2);//o2[_COMPONENT_TYPE_];
let o2defaultScope = Reflect.getMetadata(_DEFAULT_SCOPE_, o2);//o2[_DEFAULT_SCOPE_];

let COMP_P = Reflect.getMetadata(_COMPONENT_IDENTITY_, o2, "MyComponent2_getUsername");
let COMP_LN = Reflect.getMetadata(_COMPONENT_IDENTITY_, o2, "MyComponent2_getLastName");


let CLASS_COMP_P = Reflect.getMetadata(_COMPONENT_IDENTITY_, MyComponent2, "MyComponent2_getUsername");
let CLASS_COMP_LN = Reflect.getMetadata(_COMPONENT_IDENTITY_, MyComponent2, "MyComponent2_getLastName");


let CTOR_DEPS = getConstructorDependencies(MyComponent2);

let o2Identity = getComponentIdentity(o2);
let o2classIdentity = getComponentIdentity(MyComponent2);

let factoryMethods = getFactoryMethods(MyComponent2);
let comp2deps = getPropDependencies(MyComponent2);
let MyComponentScope = getScope(MyComponent);
let MyComponent2Scope = getScope(MyComponent2);


console.log(`MyComponent2.CTOR_DEPS ${JSON.stringify(CTOR_DEPS)}`);
console.log(`MyComponent.Scope ${IocComponentScope[MyComponentScope]}`);
console.log(`MyComponent2.Scope ${IocComponentScope[MyComponent2Scope]}`);

console.log();
console.log(`MyComponent2.instance.getUsername.unnamed._COMPONENT_IDENTITY_=${JSON.stringify(COMP_P)}`);
console.log(`MyComponent2.instance.getLastName.named._COMPONENT_IDENTITY_=${JSON.stringify(COMP_LN)}`);


console.log();
console.log(`MyComponent2.prototype.getUsername.unnamed=${JSON.stringify(CLASS_COMP_P)}`);
console.log(`MyComponent2.prototype.getLastName.named=${JSON.stringify(CLASS_COMP_LN)}`);

console.log();
console.log(`o2.instance identity=${JSON.stringify(o2Identity)}`);
console.log(`o2.class identity=${JSON.stringify(o2classIdentity)}`);
console.log(`comp2 deps=${JSON.stringify(comp2deps)}`);