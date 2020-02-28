import { Target } from '../../definitions';
import {
    UNNAMED_COMPONENT,
    RESERVED_COMPONENT_NAMES
} from '../../consts';
import { FrameworkError } from '../../exceptions';

export const assertNotReservedType = (componentName,
                                      clazz: Target, message?: string): boolean => {

    if (componentName===UNNAMED_COMPONENT &&
            RESERVED_COMPONENT_NAMES.includes(clazz.name)) {

        const errorMessage = `Unnamed component must be a user defined class. 
                A Generic class "${clazz.name}" cannot be a component`;

        throw new FrameworkError(message || errorMessage);
    }

    return true;
};
