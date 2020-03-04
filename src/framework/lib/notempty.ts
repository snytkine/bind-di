const isEmpty = (x: any): boolean => !x;
const notEmpty = (x: any): boolean => !isEmpty(x);
const arrayNotEmpty = (x: any[]) => Array.isArray(x) && x.length > 0;

export { isEmpty, notEmpty, arrayNotEmpty };
