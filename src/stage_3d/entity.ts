import THREE from './engine';

import {
  get_voxel,
  VOXEL_WIDTH,
} from './voxel';

import { G } from './util';

const delta = 0.16;
type RotationOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';
const temp_vector3 = new THREE.Vector3();
const temp_euler = new THREE.Euler();

export default class Entity {
  mass = 0;

  private obj: THREE.Object3D = new THREE.Object3D();

  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  private max_velocity = VOXEL_WIDTH / 20;
  friction = 0.08;
  air_friction = 0;

  private bounding_box: number[];
  private mesh: THREE.Mesh;

  private get_chunk_data: Function;
  private id;

  is_child_entity = false;
  collidable = true;

  constructor(id, bounding_box, get_chunk_data) {
    this.get_chunk_data = get_chunk_data;
    this.id = id;
    this.bounding_box = bounding_box;

    false && this.obj.add(new THREE.Mesh(
        new THREE.BoxGeometry(
          this.bounding_box[0],
          this.bounding_box[1],
          this.bounding_box[2]),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
        }),
      ));
    // this.obj.add(new THREE.AxesHelper(1));
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

  set_velocity(v) {
    this.velocity.set(v[0], v[1], v[2]);
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
    if (!this.mass) {
      return;
    }
    this.velocity.x -= this.velocity.x * this.friction;
    this.velocity.z -= this.velocity.z * this.friction;
    this.velocity.y -= G * delta * (1 - this.air_friction);
    this.direction.normalize(); // this ensures consistent movements in all directions
    this.velocity.z -= this.direction.z * this.max_velocity;
    this.velocity.x -= this.direction.x * this.max_velocity;

    this.collidable && ['x', 'y', 'z'].forEach(i => {
      if (this.collide(this.get_next_position(i))) {
        // TODO bounce
        this.velocity[i] = 0;
      }
    });

    if (this.is_child_entity) {
      const offset = [
        this.velocity.x * delta,
        this.velocity.y * delta,
        this.velocity.z * delta,
      ];
      this.translate_by(offset);
    } else {
      const offset = [
        this.velocity.x * delta,
        0,
        this.velocity.z * delta,
      ];
      this.translate_by_local(offset);
      this.translate_by([0, this.velocity.y * delta, 0]);
    }
  }

  get_position = () => this.obj.position.toArray();
  get_world_position = () => temp_vector3.setFromMatrixPosition(this.obj.matrixWorld).toArray();
  get_rotation = () => this.obj.rotation.toArray();
  get_world_rotation = (order) => temp_euler.setFromRotationMatrix(this.obj.matrixWorld, order).toArray();

  rotate_to = (v) => {
    this.obj.rotation.fromArray(v);
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
  translate_to = (v) => {
    this.obj.position.fromArray(v);
    this.obj.updateMatrixWorld(true);
  }
  translate_by = (v) => {
    this.obj.position.fromArray(this.get_position().map((i, j) => i + v[j]));
    this.obj.updateMatrixWorld(true);
  }
  translate_by_local = (v) => {
    const a = ((new THREE.Vector3()).fromArray(v)).applyMatrix4(this.obj.matrixWorld);
    this.obj.position.set(a.x, a.y, a.z);
    this.obj.updateMatrixWorld(true);
  }

  get_obj = () => this.obj;

  set_rotation_order = (order: RotationOrder) => this.obj.rotation.reorder(order);

  attach_to = (p: Entity) => {
    p.is_child_entity = true;
    this.obj.add(p.get_obj());
  }

  detach_from = (p: Entity) => this.obj.remove(p.get_obj());
}
