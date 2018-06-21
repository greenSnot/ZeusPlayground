import THREE from './engine';

import config from './config';

export let G = config.G;

export const set_g = (g) => G = g;

export const convert_rotation = (v, order_a, order_b) => {
  return (new THREE.Euler()).set(v[0], v[1], v[2], order_a).reorder(order_b).toVector3().toArray();
};

export const vector_apply_rotation = (v, e, order) => {
  const euler = new THREE.Euler(...e, order);
  return (new THREE.Vector3(...v)).applyEuler(euler).toArray();
};
