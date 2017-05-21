import THREE from './engine';

import { int_to_rgba } from '../util';
import {
  get_voxel,
  voxel_xyz_to_voxel_index,
  voxel_xyz_to_voxel_index_3x3,
  world_xyz_to_chunk_id,
  world_xyz_to_local_voxel_xyz,
  world_xyz_to_voxel_xyz,
  CHUNK_SIZE,
  CHUNK_WIDTH,
  VOXEL_WIDTH,
  WORLD_XYZ,
} from './voxel';

const delta = 0.16;
const G = 9.8;

type RGBA = [number, number, number, number];
export default class Puppet {
  mass = 0;

  private obj: THREE.Object3D = new THREE.Object3D();

  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  private max_velocity = VOXEL_WIDTH / 20;
  private friction = 0.08;

  private bounding_box: number[];
  private mesh: THREE.Mesh;

  private get_chunk_data: Function;
  private id;

  constructor(id, bounding_box, get_chunk_data) {
    this.get_chunk_data = get_chunk_data;
    this.id = id;
    this.bounding_box = bounding_box;

    // this.obj.add(new THREE.AxesHelper(150));
  }

  set_color(rgba: string) {
    if (this.mesh) {
      this.mesh.material['color'].setHex(parseInt(rgba.substr(1, 6), 16));
    } else {
      this.mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
          this.bounding_box[0],
          this.bounding_box[1],
          this.bounding_box[2]),
        new THREE.MeshPhongMaterial({
          color: parseInt(rgba.substr(1, 6), 16),
          transparent: true,
          opacity: parseInt(rgba.substr(7), 16) / 255,
        }),
      );
      this.obj.add(this.mesh);
    }
  }

  collide(v: THREE.Vector3) {
    const data = this.get_chunk_data();

    // ignore upper four vertex of the bounding box
    for (let i = -1; i < 2; i += 2) {
      for (let k = -1; k < 2; k += 2) {
        if (get_voxel(
          [
            v.x + i * this.bounding_box[0] / 2,
            v.y,
            v.z + k * this.bounding_box[2] / 2,
          ],
          data,
        )) {
          return true;
        }
      }
    }
    return false;
  }

  set_direction(v: number[]) {
    this.direction.set(
      v[0],
      v[1],
      v[2],
    );
  }

  set_max_velocity(v: number) {
    this.max_velocity = v;
  }

  change_velocity(v: number[]) {
    this.velocity.set(
      this.velocity.x + v[0],
      this.velocity.y + v[1],
      this.velocity.z + v[2],
    );
  }

  get_next_position(axis) {
    const next_position = new THREE.Vector3().copy(this.obj.position);
    next_position.y -= this.bounding_box[1] / 2;
    const axis_to_v = {
      x: [1, 0, 0],
      y: [0, 1, 0],
      z: [0, 0, 1],
    };
    const v = new THREE.Vector3();
    v.fromArray(axis_to_v[axis]).applyQuaternion(this.obj.quaternion);
    next_position.add(v.multiplyScalar(this.velocity[axis] * delta));
    return next_position;
  }

  update() {
    this.velocity.x -= this.velocity.x * this.friction;
    this.velocity.z -= this.velocity.z * this.friction;
    this.velocity.y -= G * this.mass * delta;
    this.direction.normalize(); // this ensures consistent movements in all directions
    this.velocity.z -= this.direction.z * this.max_velocity;
    this.velocity.x -= this.direction.x * this.max_velocity;

    ['x', 'y', 'z'].map(i => {
      if (this.collide(this.get_next_position(i))) {
        // TODO bounce
        this.velocity[i] = 0;
      }
    });

    this.obj.translateX(this.velocity.x * delta);
    this.obj.translateY(this.velocity.y * delta);
    this.obj.translateZ(this.velocity.z * delta);
  }

  get_position = () => this.obj.position.toArray();
  get_rotation = () => this.obj.rotation.toArray();
  set_rotation = (v) => {
    this.obj.rotation.fromArray(v);
    this.obj.updateMatrixWorld(true);
  }
  set_position = (v) => {
    this.obj.position.fromArray(v);
    this.obj.updateMatrixWorld(true);
  }
  rotate_by = (v) => {
    const rotation = this.get_rotation();
    this.obj.rotation.fromArray([
      rotation[0] + v[0],
      rotation[1] + v[1],
      rotation[2] + v[2],
      this.obj.rotation.order,
    ]);
  }
  translate_by = (v) => {
    this.obj.position.fromArray(this.get_position().map((i, j) => i + v[j]));
    this.obj.updateMatrixWorld(true);
  }
  translate_local_by = (v) => {
    const a = ((new THREE.Vector3()).fromArray(v)).applyMatrix4(this.obj.matrixWorld);
    this.obj.position.set(a.x, a.y, a.z);
    this.obj.updateMatrixWorld(true);
  }

  get_obj = () => this.obj;

  add = (p: Puppet) => this.obj.add(p.get_obj());
  remove = (p: Puppet) => this.obj.remove(p.get_obj());
}