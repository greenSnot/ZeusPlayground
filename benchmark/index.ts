import { ao_culled, voxels_to_geo_attributes, CHUNK_SIZE, CHUNK_SIZE_CUBIC } from '../src/stage_3d/voxel';
import { seed } from '../src/util';

import * as microtime from 'microtime';

const iterations = 40;

let random = seed(123);
function official_culled(volume, dims) {
  // Precalculate direction vectors for convenience
  const dir = new Array(3);
  for (let i = 0; i < 3; ++i) {
    dir[i] = [[0, 0, 0], [0, 0, 0]];
    dir[i][0][(i + 1) % 3] = 1;
    dir[i][1][(i + 2) % 3] = 1;
  }
  const max_faces = volume * 6;
  // March over the volume
  const vertices = new Float32Array(max_faces * 4);
  const faces = new Float32Array(max_faces);
  const x = [0, 0, 0];
  // Incrementally update bounds (this is a bit ugly)
  const B = [
    [false, true],
    [false, true],
    [false, true],
  ];
  let n = -dims[0] * dims[1];
  let vertices_count = 0;
  let faces_count = 0;
  const vertices_push = i => i.forEach(j => vertices[vertices_count++] = j);
  const faces_push = i => i.forEach(j => faces[faces_count++] = j);
  for (B[2] = [false, true], x[2] = -1; x[2] < dims[2]; B[2] = [true, (++x[2] < dims[2] - 1)])
  for (n -= dims[0], B[1] = [false, true], x[1] = -1; x[1] < dims[1]; B[1] = [true, (++x[1] < dims[1] - 1)])
  for (n -= 1, B[0] = [false, true], x[0] = -1; x[0] < dims[0]; B[0] = [true, (++x[0] < dims[0] - 1)], ++n) {
    // Read current voxel and 3 neighboring voxels using bounds check results
    let p = (B[0][0] && B[1][0] && B[2][0]) ? volume[n] : 0
      , b = [(B[0][1] && B[1][0] && B[2][0]) ? volume[n + 1] : 0
        , (B[0][0] && B[1][1] && B[2][0]) ? volume[n + dims[0]] : 0
        , (B[0][0] && B[1][0] && B[2][1]) ? volume[n + dims[0] * dims[1]] : 0
      ];
    // Generate faces
    for (let d = 0; d < 3; ++d)
      if ((!!p) !== (!!b[d])) {
        const s = !p ? 1 : 0;
        const t = [x[0], x[1], x[2]]
          , u = dir[d][s]
          , v = dir[d][s ^ 1];
        ++t[d];

        const v_count = vertices_count;
        vertices_push([t[0], t[1], t[2]]);
        vertices_push([t[0] + u[0], t[1] + u[1], t[2] + u[2]]);
        vertices_push([t[0] + u[0] + v[0], t[1] + u[1] + v[1], t[2] + u[2] + v[2]]);
        vertices_push([t[0] + v[0], t[1] + v[1], t[2] + v[2]]);
        faces_push([v_count, v_count + 1, v_count + 2, v_count + 3, s ? b[d] : p]);
      }
  }
  return { vertices: vertices, faces: faces };
}

const benchmark = {
  official_culled: {
    fn: i => official_culled(i, [CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE]),
  },
  ao_culled: {
    fn: i => ao_culled(i, false),
  },
};

const generator = {
  Sphere: (i, j, k) => i * i + j * j + k * k <= 16 * 16 ? 1 : 0,
  Noise: (i, j, k) => random() < 0.1 ? random() * 0xffffff : 0,
  'Dense Noise': (i, j, k) => Math.round(random() * 0xffffff),
  Checker: (i, j, k) => !!((i + j + k) & 1) ? (((i ^ j ^ k) & 2) ? 1 : 0xffffff) : 0,
  Hill: (i, j, k) => j <= 16 * Math.exp(-(i * i + k * k) / 64) ? 1 : 0,
  Valley: (i, j, k) => j <= (i * i + k * k) * 31 / (32 * 32 * 2) + 1 ? 1 + (1 << 15) : 0,
  'Hilly Terrain': (i, j, k) => {
    const h0 = 3.0 * Math.sin(Math.PI * i / 12.0 - Math.PI * k * 0.1) + 27;
    if (j > h0 + 1) {
      return 0;
    }
    if (h0 <= j) {
      return 1;
    }
    const h1 = 2.0 * Math.sin(Math.PI * i * 0.25 - Math.PI * k * 0.3) + 20;
    if (h1 <= j) {
      return 2;
    }
    if (2 < j) {
      return random() < 0.1 ? 0x222222 : 0xaaaaaa;
    }
    return 3;
  },
};

function get_chunk_data(generatorName) {
  const array = new Int8Array(CHUNK_SIZE_CUBIC);
  const f = generator[generatorName];
  let n = 0;
  for (let x = 0; x < CHUNK_SIZE; x += 1) {
    for (let y = 0; y < CHUNK_SIZE; y += 1) {
      for (let z = 0; z < CHUNK_SIZE; z += 1, n += 1) {
        array[n] = f(x, y, z) || 0;
      }
    }
  }
  return array;
}

Object.keys(benchmark).forEach(name => {
  random = seed(123);
  Object.keys(generator).forEach(gname => {
    let res;
    let start;

    start = microtime.now();
    for (let i = 0; i < iterations; i += 1) {
      res = benchmark[name].fn(get_chunk_data(gname));
    }
    benchmark[name][gname] = microtime.now() - start;
  });
});

console.log(benchmark);

Object.keys(benchmark.ao_culled).forEach(k => {
  if (k !== 'fn') {
    const diff = benchmark.ao_culled[k] / benchmark.official_culled[k] - 1;
    console.log([k, (diff > 0 ? '+' : '-') + Math.round(Math.abs(diff * 100)) + '%']);
  }
});
Object.keys(benchmark).forEach(name => {
  console.log(`${name}: total ${Object.keys(benchmark[name]).reduce((m, k) => k === 'fn' ? m : m + benchmark[name][k], 0)}`);
});