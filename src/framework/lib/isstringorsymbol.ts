export default function isStringOrSymbol(x: unknown): boolean {
  return typeof x === 'string' || typeof x === 'symbol';
}
