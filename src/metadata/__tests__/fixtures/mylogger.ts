import Logger from './logger';

export default class MyLogger extends Logger {
  static log = (...messages: string[]): string => {
    return messages.reduce((prev, curr) => `${prev} ${curr}`, '');
  };
}
