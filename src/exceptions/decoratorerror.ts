import FrameworkError from './frameworkerror';

export default class DecoratorError extends FrameworkError {
  constructor(public message: string, public nestedException?: Error) {
    super(message, nestedException);
  }
}
