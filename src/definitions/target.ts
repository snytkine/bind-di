export type Target = {
  new?(...args: any[]): any;
  name?: string;
  constructor: Function;
  prototype?: any;
  length?: number;
};
