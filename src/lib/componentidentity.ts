import { StringOrSymbol } from '../definitions/types';
import { Target } from '../definitions/target';

export function stringifyIdentity(identity: ComponentIdentity): string {
  return `componentName=${String(identity?.componentName)} className=${identity?.clazz?.name}`;
}

export class ComponentIdentity {
  private readonly name: StringOrSymbol;

  private readonly targetClass: Target;

  constructor(cn: StringOrSymbol, targetClass: Target) {
    this.name = cn;
    this.targetClass = targetClass;
  }

  get componentName(): StringOrSymbol {
    return this.name;
  }

  get clazz() {
    return this.targetClass;
  }

  toString(): string {
    return stringifyIdentity(this);
  }
}
