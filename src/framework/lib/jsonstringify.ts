export default function jsonStringify(o: any, pretty: boolean = true): string {
  try {
    if (pretty) {
      return JSON.stringify(o, null, 2);
    }

    return JSON.stringify(o);
  } catch (e) {
    return `JSON.stringify error ${e.message}`;
  }
}
