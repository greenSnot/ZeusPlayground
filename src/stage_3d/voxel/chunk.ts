import Worker from 'worker-loader!./worker';

import THREE from '../engine';

enum WorkerStatus {
  idle = 0,
  working = 1,
}

const N_WORKER = 4;
const workers = new Array(N_WORKER).fill(undefined).map(i => new Worker());
const worker_status = new Array(N_WORKER).fill(undefined).map(i => WorkerStatus.idle);
async function get_idle_worker(): Promise<[Worker, number]> {
  while (true) {
    for (let i = 0; i < N_WORKER; ++i) {
      if (worker_status[i] === WorkerStatus.idle) {
        worker_status[i] = WorkerStatus.working;
        return [workers[i], i];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/**
 *
 * x-y plane, z = 0
 * ...
 * x-y plane, z = 1
 * ...
 * x-y plane, z = 2
 * ...
 */
const texture = new THREE.TextureLoader().load('images/fgrass.png');
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.LinearMipMapLinearFilter;
const material = new THREE.MeshBasicMaterial(
  {
    map: texture,
    vertexColors: THREE.VertexColors,
  },
);
function gen_mesh_from_geo_attributes(attributes) {
  const geometry = new THREE.BufferGeometry();
  Object.keys(attributes).forEach(i => {
    if (i === 'index') {
      geometry.setIndex(new THREE.Uint16BufferAttribute(attributes[i][0], 1));
    } else {
      geometry.addAttribute(i, new THREE.Float32BufferAttribute(attributes[i][0], attributes[i][1]));
    }
  });

  const chunk_mesh = new THREE.Mesh(geometry, material);
  return chunk_mesh;
}

export async function gen_chunk_mesh(chunk_id, voxels, is_running) {
  const version = Date.now();
  return new Promise((resolve, reject) => {
    get_idle_worker().then(([worker, id]) => {
      worker.postMessage(voxels);
      worker.onmessage = ({ data }) => {
        if (!is_running()) {
          reject();
          return;
        }
        worker_status[id] = WorkerStatus.idle;
        resolve([gen_mesh_from_geo_attributes(data), version]);
      };
    });
  });

  /**
   * z
   * |
   * +-- x
   *
   * faces: x, -x, y, -y, z, -z
   * vertices: xyz, -xyz, x-yz, xy-z, -x-yz, -xy-z, x-y-z, -x-y-z
   *
   * texture: {
   *   dirt: -y,
   *   grass: y,
   *   grass-dirt: x, -x, z, -z,
   * }
   *
   * 1. shape
   * 2. ao map
   */
}