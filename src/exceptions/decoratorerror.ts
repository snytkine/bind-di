import { FrameworkError } from './frameworkerror';

export class DecoratorError extends FrameworkError {
    constructor(message: string, nestedException?: Error) {
        super(message, nestedException);
    }
}
