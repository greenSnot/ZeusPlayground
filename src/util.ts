export function str_to_dom(str: string) {
  const dom = new DOMParser().parseFromString(str, 'text/xml');
  return dom;
}

export function flatten(arr) {
  const res = [];
  for (let i = 0; i < arr.length; ++i) {
    if (arr[i].length) { // isArray
      res.push(...arr[i]);
    } else {
      res.push(arr[i]);
    }
  }
  return res;
}

export function seed(s) {
  return function() {
    const t = Math.sin(s++);
    return t - Math.floor(t);
  };
}

export const deep_clone = (a) => {
  if (typeof a !== 'object') {
    return a;
  }
  if (a instanceof Array) {
    return a.map(i => deep_clone(i));
  } else {
    return Object.keys(a).reduce(
      (m, i) => {
        m[i] = deep_clone(a[i]);
        return m;
      },
      {},
    );
  }
};

export const int_to_rgba = (a) => {
  return [24, 16, 8, 0].map(i => (a >> i) & 0xff);
};