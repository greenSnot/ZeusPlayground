/**
 * @author mrdoob / http://mrdoob.com/
 */
import THREE from './engine';

import {
  world_xyz_to_chunk_id,
  WORLD_XYZ,
} from './voxel';

export default class Controller {
  enabled = false;

  pitchObject = new THREE.Object3D();
  yawObject = new THREE.Object3D();

  direction = new THREE.Vector3(0, 0, -1);
  rotation = new THREE.Euler(0, 0, 0, 'YXZ');

  private chunk_id;

  get_chunk_data: Function;
  notify_update_adjacent_chunks: Function;

  constructor(camera, position, notify_update_adjacent_chunks) {
    this.notify_update_adjacent_chunks = notify_update_adjacent_chunks;

    camera.rotation.set(0, 0, 0);

    this.pitchObject.add(camera);

    this.yawObject.position.copy(position);
    this.yawObject.add(this.pitchObject);

    document.addEventListener('mousemove', this.onMouseMove, false);
  }

  onMouseMove = (event) => {
    if (this.enabled === false) {
      return;
    }
    const PI_2 = Math.PI / 2;

    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    this.yawObject.rotation.y -= movementX * 0.002;
    this.pitchObject.rotation.x -= movementY * 0.002;

    this.pitchObject.rotation.x = Math.max(- PI_2, Math.min(PI_2, this.pitchObject.rotation.x));
  }

  getDirection = (rx = 0, ry = 0) => {
    // assumes the camera itself is not rotated
    this.rotation.set(this.pitchObject.rotation.x + rx, this.yawObject.rotation.y + ry, 0);
    this.direction.set(0, 0, -1).applyEuler(this.rotation);
    return this.direction;
  }

  getObject = () => {
    return this.yawObject;
  }

  dispose = () => {
    document.removeEventListener('mousemove', this.onMouseMove, false);
  }

  get_rotation() {
    return [
      this.yawObject.rotation.x,
      this.yawObject.rotation.y,
      this.pitchObject.rotation.z,
    ];
  }

  get_position() {
    return this.yawObject.position.toArray();
  }

  update = () => {
    const chunk_id = world_xyz_to_chunk_id(this.yawObject.position.toArray() as WORLD_XYZ);
    if (this.chunk_id !== chunk_id) {
      this.notify_update_adjacent_chunks(chunk_id);
      this.chunk_id = chunk_id;
    }
  }
}