export const VOXEL_WIDTH = 1;
export const HALF_VOXEL_WIDTH = VOXEL_WIDTH / 2;
export const CHUNK_SIZE_BITS = 4;
export const CHUNK_SIZE = 1 << CHUNK_SIZE_BITS; // should be 2^n
export const CHUNK_WIDTH = CHUNK_SIZE * VOXEL_WIDTH;
const CHUNK_SIZE_MASK = (1 << CHUNK_SIZE_BITS) - 1;
const CHUNK_SIZE_SQUARE_OFFSET = 2 * CHUNK_SIZE_BITS;
const CHUNK_SIZE_SQUARE_MASK = (1 << CHUNK_SIZE_SQUARE_OFFSET) - 1;
export const CHUNK_SIZE_CUBIC = (CHUNK_SIZE << CHUNK_SIZE_BITS) << CHUNK_SIZE_BITS;

export type XYZ = [number, number, number];
export type CHUNK_XYZ = XYZ;
export type VOXEL_XYZ = XYZ;
export type WORLD_XYZ = XYZ;

const uvs_bottom = [
  0, 0,
  1, 1 / 3,
  0, 1 / 3,
  1, 0,
];
const uvs_side = uvs_bottom.map((v, i) => i % 2 ? v + 1 / 3 : v);
const uvs_top = uvs_bottom.map((v, i) => i % 2 ? v + 2 / 3 : v);

export const face_to_uvs = {
  x: uvs_side,
  y: uvs_top,
  z: uvs_side,
  '-x': uvs_side,
  '-y': uvs_bottom,
  '-z': uvs_side,
};

export const face_indices = [0, 1, 2, 0, 3, 1];
export const face_to_positions = {
  x: [HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH],
  y: [-HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH],
  z: [-HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH],
  '-x': [-HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH],
  '-y': [-HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH],
  '-z': [HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH, -HALF_VOXEL_WIDTH],
};

/**
 * 2---1
 * | / |
 * 0---3
 *
 * 0 dark
 * 1 light
 *
 * example:
 * index 3 2 1 0
 *       0 1 1 0 => 0110 => (dark light light dark)
 *
 * ao_map_kinds.length = 2^4 = 16
 * ao_map_kinds = 16[] x 12[]
 */
const light = [1, 1, 1];
const dark = [0.3, 0.3, 0.3];
export const ao_map_kinds = new Array(16);
const build_ao_map_kinds = () => {
  const q = [0, 0, 1, 0];
  while (q.length) {
    const kinds = q.shift();
    const depth = q.shift();
    if (depth === 4) {
      ao_map_kinds[kinds] = [];
      [0, 1, 2, 3].forEach(i => {
        ao_map_kinds[kinds].push(...((kinds & (1 << i)) >> i) ? light : dark);
      });
      continue;
    }
    q.push(kinds + (1 << depth), depth + 1);
    q.push(kinds, depth + 1);
  }
};
build_ao_map_kinds();

/**
 *
 * @param voxels material_id [
 *  2(0,0,1) 4(0,0,2) 1(0,0,3) ...
 *  3(0,1,1) 2(0,1,2) 3(0,1,3) ...
 *  ...
 *  a(1,0,1) b(1,0,2) c(1,0,3) ...
 *  ...
 * ]
 */

 /**
  * zzzyyyxxx -> [x, y, z]
  */
export const voxel_index_to_voxel_xyz = (idx) => ([
  idx & CHUNK_SIZE_MASK,
  (idx & CHUNK_SIZE_SQUARE_MASK) >> CHUNK_SIZE_BITS,
  idx >> CHUNK_SIZE_SQUARE_OFFSET,
] as VOXEL_XYZ);

export const voxel_xyz_to_voxel_index = (i: VOXEL_XYZ) => (i[2] << CHUNK_SIZE_SQUARE_OFFSET) | (i[1] << CHUNK_SIZE_BITS) | i[0];
export const voxel_index_to_voxel_xyz_3x3 = (idx) => ([
  idx % 3,
  Math.floor((idx % 9) / 3),
  Math.floor(idx / 9),
] as VOXEL_XYZ);
export const voxel_xyz_to_voxel_index_3x3 = (i: VOXEL_XYZ) => i[0] + i[1] * 3 + i[2] * 9;

export const world_xyz_to_voxel_xyz = (i: WORLD_XYZ) => ([
  Math.floor(i[0] / VOXEL_WIDTH),
  Math.floor(i[1] / VOXEL_WIDTH),
  Math.floor(i[2] / VOXEL_WIDTH),
] as VOXEL_XYZ);

export const world_xyz_to_local_voxel_xyz = (i: WORLD_XYZ) => ([
  Math.floor(i[0] / VOXEL_WIDTH),
  Math.floor(i[1] / VOXEL_WIDTH),
  Math.floor(i[2] / VOXEL_WIDTH),
].map(j => j < 0 ? (CHUNK_SIZE + (j % CHUNK_SIZE)) % CHUNK_SIZE : j % CHUNK_SIZE) as VOXEL_XYZ);

/**
 *
 * y      x
 * |  i  / / /
 * | hf / / /
 * |gec/ / /
 * |db/ / /
 * |a/ / /
 * |/_/_/______z
 *
 * y     x
 * |   r/ / /
 * |  qo / /
 * | pnl/ /
 * | mk/ /
 * |/j/_/______z
 *
 * y     x
 * |    /a/ /
 * |   /zx /
 * |  /ywu/
 * | / vt/
 * |/_/s/______z
 *
 */
export const ao_culled = (chunk, enable_ao = true) => {
  const n_max_vertex = chunk.reduce((m, i) => m + (i ? 1 : 0), 0);
  const n_max_faces = n_max_vertex * 6;
  const colors = new Float32Array(n_max_faces * 4 * 3);
  let colors_index = 0;
  const vertex_pos = new Float32Array(n_max_faces * 4 * 3);
  let vertex_pos_index = 0;
  const uvs = new Float32Array(n_max_faces * 4 * 2);
  let uvs_index = 0;
  const face_to_ignore = {
    x: 22,
    y: 16,
    z: 14,
    '-x': 4,
    '-y': 10,
    '-z': 12,
  };
  Object.keys(face_to_ignore).forEach(i => {
    face_to_ignore[i] = 1 << face_to_ignore[i];
  });
  const face_vertice_color = {
    x: [
      [19, 20],
      [21, 24, 25],
      [23, 25, 26],
      [18, 19],
    ],
    y: [
      [6, 7, 15],
      [17, 26, 25],
      [15, 24, 25],
      [7, 8, 17],
    ],
    z: [
      [11, 20],
      [17, 23, 26],
      [5, 8, 17],
      [2, 11],
    ],
  };
  Object.keys(face_vertice_color).forEach(i => {
    face_vertice_color[i] = face_vertice_color[i].map(
      j => j.reduce((m, k) => m |= (1 << k), 0),
    );
  });
  face_vertice_color['-x'] = [-1, -1, -1, -1];
  face_vertice_color['-y'] = [-1, -1, -1, -1];
  face_vertice_color['-z'] = [-1, -1, -1, -1];

  const faces = Object.keys(face_vertice_color);
  let last_mask;
  for (let i = 0; i < chunk.length; ++i) {
    const v = chunk[i];
    const [x, y, z] = voxel_index_to_voxel_xyz(i);

    /**
     * mask bits
     * 31 30 29 ...
     * 0  0  1 ...
     * none  block
     */
    let mask = 0;
    const in_range = (t) => t >= 0 && t < CHUNK_SIZE;
    const in_edge = (t) => t === 0 || t === CHUNK_SIZE - 1;
    const needs_check_outlier = in_edge(x) || in_edge(y) || in_edge(z);
    if (x === 0) {
      for (let a = -1, t = 0; a < 2; ++a) {
        for (let b = -1; b < 2; ++b) {
          for (let c = -1; c < 2; ++c, ++t) {
            if (needs_check_outlier && (!in_range(x + a) || !in_range(y + b) || !in_range(z + c))) {
              continue;
            }
            mask = mask | ((chunk[voxel_xyz_to_voxel_index([x + a, y + b, z + c])] ? 1 : 0) << t);
          }
        }
      }
    } else {
      mask = last_mask >> 9;
      for (let b = -1, t = 18; b < 2; ++b) {
        for (let c = -1; c < 2; ++c, ++t) {
          if (needs_check_outlier && (!in_range(x + 1) || !in_range(y + b) || !in_range(z + c))) {
            continue;
          }
          mask = mask | ((chunk[voxel_xyz_to_voxel_index([x + 1, y + b, z + c])] ? 1 : 0) << t);
        }
      }
    }
    last_mask = mask;
    if (!v) {
      continue;
    }

    const offset = [x, y, z].map(j => j * VOXEL_WIDTH + VOXEL_WIDTH / 2);
    faces.forEach(f => {
      if (mask & face_to_ignore[f]) {
        return;
      }
      face_to_positions[f].forEach((j, idx) => {
        vertex_pos[vertex_pos_index++] = j + offset[idx % 3];
      });
      face_to_uvs[f].forEach(j => {
        uvs[uvs_index++] = j;
      });
      enable_ao && ao_map_kinds[
        [0, 1, 2, 3].reduce(
          (m, j) => m |= (mask & (face_vertice_color as any)[f][j] ? 0 : 1) << j,
          0,
        )
      ].forEach(j => {
        colors[colors_index++] = j;
      });
    });
  }
  return [
    [vertex_pos, vertex_pos_index],
    [colors, enable_ao ? colors_index : vertex_pos_index ],
    [uvs, uvs_index],
  ];
};

export const chunk_xyz_to_world_xyz = (i: CHUNK_XYZ) => i.map(j => j * CHUNK_WIDTH);
export const chunk_xyz_to_chunk_id = (i: CHUNK_XYZ) => i.join(',');
export const chunk_id_to_chunk_xyz = id => id.split(',').map(i => parseInt(i)) as CHUNK_XYZ;

export const world_xyz_to_chunk_xyz = (i: WORLD_XYZ) => i.map(j => Math.floor(j / CHUNK_WIDTH)) as CHUNK_XYZ;
export const world_xyz_to_chunk_id = (i: WORLD_XYZ) => chunk_xyz_to_chunk_id(world_xyz_to_chunk_xyz(i));

export const get_voxel = (i: WORLD_XYZ, chunk_data) => {
  const data = chunk_data[world_xyz_to_chunk_id(i)];
  if (!data) {
    return 0;
  }
  return data[voxel_xyz_to_voxel_index(world_xyz_to_local_voxel_xyz(i))];
};

export const set_voxel = (i: WORLD_XYZ, material, chunk_data) => {
  const chunk_id = world_xyz_to_chunk_id(i);
  const data = chunk_data[chunk_id];
  data[voxel_xyz_to_voxel_index(world_xyz_to_local_voxel_xyz(i))] = material;
  return chunk_id;
};

export const voxels_to_geo_attributes = (voxels, enable_ao = true) => {
  const [
    [vertex_positions, vertex_positions_length],
    [vertex_colors, vertex_colors_length],
    [vertex_uvs, vertex_uvs_length],
  ] = ao_culled(voxels, enable_ao);
  const n_vertex = vertex_positions_length as number / 3;
  const n_faces = n_vertex / 4;
  const n_indices = n_faces * 6;

  const indices = new Uint16Array(n_indices);
  for (let i = 0; i < n_indices; ++i) {
    indices[i] = 4 * Math.floor(i / 6) + face_indices[i % 6];
  }

  const normals = new Float32Array(vertex_positions_length as number);
  for (let i = 0; i < vertex_positions_length; ++i) {
    normals[i] = i % 3 === 1 ? 1 : 0;
  }
  const colors = vertex_colors;
  const uvs = vertex_uvs;
  const positions = vertex_positions;
  return {
    position: [positions, 3],
    normal: [normals, 3],
    color: [colors, 3],
    index: [indices, 1],
    uv: [uvs, 2],
  };
};
