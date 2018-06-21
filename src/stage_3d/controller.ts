import THREE from './engine';

import {
  world_xyz_to_chunk_id,
  WORLD_XYZ,
} from './voxel';

export default class Controller {
  enabled = false;

  obj = new THREE.Object3D();

  direction = new THREE.Vector3(0, 0, -1);

  private chunk_id = '0,0,0';

  get_chunk_data: Function;
  notify_update_adjacent_chunks: Function;

  constructor(camera, position, notify_update_adjacent_chunks) {
    this.notify_update_adjacent_chunks = notify_update_adjacent_chunks;

    camera.rotation.set(0, 0, 0);

    this.obj.position.copy(position);
    this.obj.add(camera);
    this.obj.rotation.reorder('YXZ');

    document.addEventListener('mousemove', this.onMouseMove, false);
  }

  onMouseMove = (event) => {
    if (this.enabled === false) {
      return;
    }
    const PI_2 = Math.PI / 2;

    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    this.obj.rotation.y -= movementX * 0.002;
    this.obj.rotation.x -= movementY * 0.002;

    this.obj.rotation.x = Math.max(- PI_2, Math.min(PI_2, this.obj.rotation.x));
  }

  get_direction = (rx = 0, ry = 0, rz = 0) => {
    const rotation = (new THREE.Euler()).reorder('YXZ').set(this.obj.rotation.x + rx, this.obj.rotation.y + ry, this.obj.rotation.z + rz);
    this.direction.set(0, 0, -1).applyEuler(rotation);
    return this.direction;
  }

  get_obj = () => {
    return this.obj;
  }

  dispose = () => {
    document.removeEventListener('mousemove', this.onMouseMove, false);
  }

  get_rotation() {
    return [
      this.obj.rotation.x,
      this.obj.rotation.y,
      this.obj.rotation.z,
    ];
  }

  get_position(): number[] {
    return this.obj.position.toArray();
  }

  rotate_to(v) {
    this.obj.rotation.x = v[0];
    this.obj.rotation.y = v[1];
    this.obj.rotation.z = v[2];
  }

  update = () => {
    const chunk_id = world_xyz_to_chunk_id(this.obj.position.toArray() as WORLD_XYZ);
    if (this.chunk_id !== chunk_id) {
      this.notify_update_adjacent_chunks(chunk_id);
      this.chunk_id = chunk_id;
    }
  }
}