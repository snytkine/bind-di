import jsonStringify from '../jsonstringify';

describe('Test of jsonStringify function', () => {
  test('should return formatted string', () => {
    const s = `{
  "id": 123,
  "title": "Book"
}`;
    const obj = {
      id: 123,
      title: 'Book',
    };

    const res = jsonStringify(obj);

    expect(res).toEqual(s);
  });

  test('should return plain string', () => {
    const s = '{"id":123,"title":"Book"}';
    const obj = {
      id: 123,
      title: 'Book',
    };

    const res = jsonStringify(obj, false);

    expect(res).toEqual(s);
  });

  test(`jsonStringify object with circular reference
  should return plain string with Error message`, () => {
    const obj: any = {};
    obj.a = { b: obj };

    const res = jsonStringify(obj, false);

    expect(res.includes('JSON.stringify error')).toEqual(true);
  });
});
