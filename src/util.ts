export function str_to_dom(str: string) {
  const dom = new DOMParser().parseFromString(str, 'text/xml');
  return dom;
}

export function flatten(arr) {
  const res = [];
  for (let i = 0; i < arr.length; ++i) {
    if (Array.isArray(arr[i])) {
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

export const save_to_file = (filename, content, content_type = 'text/plain') => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: content_type });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
};