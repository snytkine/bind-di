import { FrameworkError } from './frameworkerror';

export class DecoratorError extends FrameworkError {
    constructor(message: string) {
        super(message);
    }
}
