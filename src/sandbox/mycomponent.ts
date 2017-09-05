import 'reflect-metadata'
import {Component, _COMPONENT_NAME_, _COMPONENT_TYPE_, _DEFAULT_SCOPE_, required} from '../'
import {Person} from './person'


export interface IfPerson {
    first: string
    last: string
}

@Component
export class MyComponent {

    constructor(private settings: any) {

    }

    getUsername() {
        return "John"
    }
}


@Component("CHEEZE")
export class MyComponent2 {

    //@Component
    lastName: String = "Smith";

    description: Person;

    //@Component("my_constructor")
    /**
     * param decorators and design:paramtypes for paramtypes of constructor
     * are applied to Constructor function!
     * the constructor() is NOT a separate function in JS it's a Constructor function
     * It is treated the same way as adding decorator directly on a class
     *
     * @param {Person} settings
     * @param {string} bla
     */
    constructor(@required settings: Person, @required bla:string) {
        this.description = {first: "John", last: "Smith"}
    }

    @Component
    MyComponent2_getUsername(@required gsx:any): Person {
        return new Person("John", "Smith")
    }

    @Component("lastname")
    MyComponent2_getLastName() {
        return new Person("", "LastName")
    }

    //@Component
    get config(): Person {
        return this.description
    }
}


//let o = new MyComponent("HELLO");
//let n = o.getUsername();

let o2 = new MyComponent2(new Person("HELLO", "SMITY"), "Hi");
let n2 = o2.MyComponent2_getUsername("YES");
let o2name = Reflect.getMetadata(_COMPONENT_NAME_, o2); //o2[_COMPONENT_NAME_];
let o2type = Reflect.getMetadata(_COMPONENT_TYPE_, o2);//o2[_COMPONENT_TYPE_];
let o2defaultScope = Reflect.getMetadata(_DEFAULT_SCOPE_, o2);//o2[_DEFAULT_SCOPE_];

let COMP_P = Reflect.getMetadata(_COMPONENT_NAME_, o2, "MyComponent2_getUsername");
let COMP_LN = Reflect.getMetadata(_COMPONENT_NAME_, o2, "MyComponent2_getLastName");


let CLASS_COMP_P = Reflect.getMetadata(_COMPONENT_NAME_, MyComponent2, "MyComponent2_getUsername");
let CLASS_COMP_LN = Reflect.getMetadata(_COMPONENT_NAME_, MyComponent2, "MyComponent2_getLastName");

let COMP_NAME_PROTO_NAMED = Reflect.getMetadata(_COMPONENT_NAME_, MyComponent2);
let COMP_NAME_PROTO = Reflect.getMetadata(_COMPONENT_NAME_, MyComponent);


//console.log("username=", n);
//console.log("username2=", n2.first);
console.log(`MyComponent2.instance._COMPONENT_NAME_=${o2name} MyComponent2.instance._COMPONENT_TYPE_=${o2type} defaultScope=${o2defaultScope}`);

console.log();
console.log(`MyComponent2.instance.getUsername.unnamed._COMPONENT_NAME_=${COMP_P}`);
console.log(`MyComponent2.instance.getLastName.named._COMPONENT_NAME_=${COMP_LN}`);


console.log()
console.log(`MyComponent2.prototype.getUsername.unnamed=${CLASS_COMP_P}`);
console.log(`MyComponent2.prototype.getLastName.named=${CLASS_COMP_LN}`);

console.log();
console.log(`MyComponent2.prototype.named.name=${COMP_NAME_PROTO_NAMED}`);
console.log(`MyComponent.prototype.unnamed.name=${COMP_NAME_PROTO}`);