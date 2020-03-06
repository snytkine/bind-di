/**
 * SINGLETON component created only one and same instance returned every time
 * NEWINSTANCE component is created using new keyword every time its requested
 * CONTEXT one per context instance (request/response in case of http rest context)
 * SESSION one per http session
 *
 *
 * @important value must be in ORDER from smallest to largest lifecycle
 * This will be used in validation of dependency injection where
 * component with smaller lifecycle in not allowed to be injected
 * into component with larger lifecycle.
 *
 * @todo what if users of this framework have other
 * scopes not known to this framework at this time?
 * Framework is only aware of SINGLETON and NEWINSTSNCE scopes
 * REQUEST and SESSION scopes are what we anticipate to have
 */
export enum ComponentScope {
  NEWINSTANCE = 1,
  REQUEST,
  SESSION,
  SINGLETON,
}

export enum DependencyType {
  CONSTRUCTOR_PARAMETER,
  PROPERTY,
  SETTER,
  METHOD_PARAMETER,
  UNKNOWN,
}

export enum TargetStereoType {
  CONSTRUCTOR,
  PROTOTYPE,
  UNKNOWN,
}
