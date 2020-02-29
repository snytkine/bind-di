export default class FrameworkError extends Error {
  constructor(message: string, public nestedError?: Error) {
    super(message);
  }
}
