export const isStringOrSymbol = (x: unknown): boolean => {
    return (typeof x==='string' || typeof x==='symbol');
};
