import { Target } from '../../definitions';
import { RESERVED_COMPONENT_NAMES, UNNAMED_COMPONENT } from '../../consts';
import FrameworkError from '../../exceptions/frameworkerror';

export default function assertNotReservedType(
  componentName,
  clazz?: Target,
  message?: string,
): boolean {
  if (
    clazz &&
    componentName === UNNAMED_COMPONENT &&
    RESERVED_COMPONENT_NAMES.includes(clazz.name)
  ) {
    const errorMessage = `Unnamed component must be a user defined class. 
                A Generic class "${clazz.name}" cannot be a component`;

    throw new FrameworkError(message || errorMessage);
  }

  return true;
}
