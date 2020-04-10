import { Component } from '../../../decorators';

@Component('mylogger')
export default class Logger {
  static log = (...messages: string[]): string => {
    return messages.reduce((prev, curr) => `${prev} ${curr}`, '');
  };
}
