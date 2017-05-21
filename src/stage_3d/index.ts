import raycast from 'fast-voxel-raycast';
import THREE from './engine';

import { flatten, seed } from '../util';
import {
  ao_map_kinds,
  chunk_id_to_chunk_xyz,
  chunk_xyz_to_chunk_id,
  chunk_xyz_to_world_xyz,
  get_voxel,
  set_voxel,
  voxel_index_to_voxel_xyz,
  world_xyz_to_chunk_id,
  world_xyz_to_local_voxel_xyz,
  world_xyz_to_voxel_xyz,
  CHUNK_SIZE_CUBIC,
  CHUNK_WIDTH,
  HALF_VOXEL_WIDTH,
  VOXEL_WIDTH,
  WORLD_XYZ,
} from './voxel';
import { gen_chunk_mesh } from './voxel/chunk';

import Controller from './controller';
import Puppet from './puppet';

const random = seed(666);

enum FocusMode {
  replacement = 1,
  placement = 2,
}

enum CHUNK_MESH_STATUS {
  NONE = 0,
  PENDDING = 1,
  LOADED = 2,
}

enum CHUNK_DATA_STATUS {
  NONE = 0,
  PENDDING = 1,
  READY = 2,
}

(window as any).THREE = THREE;

type Material = number;
type ChunkData = Material[];
type ChunkMesh = THREE.Object3D;

const t = new THREE.Vector3();
let terrain_fn = (g, x, y, z) => {
  const abs = Math.abs;
  const cos = Math.cos;
  const sin = Math.sin;
  return (abs(3 * cos(x / 2) * sin(z / 2) - y + 3) < 0.5) ? 1 : 0;
};

const gen_terrain = (world_xyz) => (new Array(CHUNK_SIZE_CUBIC) as any).fill(undefined).map((v, idx) => {
  const [x, y, z] = voxel_index_to_voxel_xyz(idx);
  return terrain_fn(undefined, world_xyz[0] + x, world_xyz[1] + y, world_xyz[2] + z);
});

const CHUNK_ADJACENT_HORIZONTAL_FAR = 3;
const CHUNK_ADJACENT_VERTICAL_FAR = 1;

export class Stage3d {
  private container;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Object3D;
  private renderer;
  private controller: Controller;
  private camera_world_xyz: WORLD_XYZ;
  private focus_mode = FocusMode.replacement;

  private chunk_data: {[id: string]: ChunkData} = {};
  private chunk_mesh: {[id: string]: ChunkMesh} = {};
  private chunk_mesh_to_cancel: {[id: string]: boolean} = {};
  private chunk_mesh_status: {[id: string]: CHUNK_MESH_STATUS} = {};
  private chunk_data_status: {[id: string]: CHUNK_DATA_STATUS} = {};
  private rendered_chunks: {[id: string]: THREE.Object3D} = {};
  private changes: Map<string, boolean> = new Map();
  private cross_dom = document.getElementById('stage-cross');
  private debug_dom = document.getElementById('stage-debug');

  private notify_stop;
  private camera_offset = [0, 0, VOXEL_WIDTH * 3];

  private focused_voxel = (function() {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(VOXEL_WIDTH, VOXEL_WIDTH, VOXEL_WIDTH), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
    mesh.position.set(HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH, HALF_VOXEL_WIDTH);
    const container = new THREE.Object3D();
    container.add(mesh);
    return container;
  })();
  focused_voxel_world_xyz = {
    replacement: [0, 0, 0],
    placement: [0, 0, 0],
  };

  puppets: {[name: string]: Puppet} = {};

  constructor() {
    this.container = document.getElementById('stage-3d');
    this.scene = new THREE.Scene();

    window['scene'] = this.scene;

    this.init_renderer();
    this.init_camera();
    this.init_lights();

    this.init_world();
    this.init_events();

    this.scene.add(this.focused_voxel);
  }

  private update_focused_voxel(dis = 10) {
    const hit_position = [];
    const hit_normal = [];
    const result = raycast(
      (x, y, z) => get_voxel([x, y, z], this.chunk_data),
      this.camera_world_xyz,
      this.controller.getDirection().toArray(),
      dis,
      hit_position,
      hit_normal,
    );

    if (result) {
      const p = world_xyz_to_voxel_xyz(hit_position.map(i => i.toFixed(3)) as WORLD_XYZ);
      this.focused_voxel_world_xyz.replacement = [
        p[0] - (hit_normal[0] > 0 ? 1 : 0) * VOXEL_WIDTH,
        p[1] - (hit_normal[1] > 0 ? 1 : 0) * VOXEL_WIDTH,
        p[2] - (hit_normal[2] > 0 ? 1 : 0) * VOXEL_WIDTH,
      ];
      this.focused_voxel_world_xyz.placement = [
        p[0] - (hit_normal[0] < 0 ? 1 : 0) * VOXEL_WIDTH,
        p[1] - (hit_normal[1] < 0 ? 1 : 0) * VOXEL_WIDTH,
        p[2] - (hit_normal[2] < 0 ? 1 : 0) * VOXEL_WIDTH,
      ];
      (this.focused_voxel.position.set as any)(...this.focused_voxel_world_xyz[FocusMode[this.focus_mode]]);
    } else {
      this.focused_voxel_world_xyz.placement = [Infinity, Infinity, Infinity];
      this.focused_voxel_world_xyz.replacement = [Infinity, Infinity, Infinity];
      this.focused_voxel.position.set(Infinity, Infinity, Infinity);
    }
  }

  private update_camera_world_xyz() {
    this.camera_world_xyz = t.setFromMatrixPosition(this.camera.matrixWorld).toArray() as WORLD_XYZ;
  }

  private init_camera() {
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.set(this.camera_offset[0], this.camera_offset[1], this.camera_offset[2]);
    this.controller = new Controller(
      this.camera,
      new THREE.Vector3(4 * VOXEL_WIDTH, 8 * VOXEL_WIDTH, 3 * VOXEL_WIDTH),
      (chunk_id) => this.update_adjacent_chunks(chunk_id),
    );
    this.scene.add(this.controller.getObject());
    this.update_camera_world_xyz();
  }

  private update_cross() {
    const cross_vector = t.copy(this.controller.getObject().position).project(this.camera);
    cross_vector.x = (cross_vector.x + 1) / 2 * window.innerWidth;
    cross_vector.y = -(cross_vector.y - 1) / 2 * window.innerHeight;
    this.cross_dom.style.left = cross_vector.x.toFixed(3) + 'px';
    this.cross_dom.style.top = cross_vector.y.toFixed(3) + 'px';
  }

  private init_lights() {
    const ambientLight = new THREE.AmbientLight(0xcccccc);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 0.5).normalize();
    this.scene.add(directionalLight);
  }

  private init_renderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  private init_events() {
    const self = this;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      windowHalfX = width / 2;
      windowHalfY = height / 2;
      self.camera.aspect = width / height;
      self.camera.updateProjectionMatrix();
      self.renderer.setSize(width, height);
    }
    window.addEventListener('resize', onWindowResize, false);

    const pointerLockChange = (event) => {
      this.controller.enabled = document.pointerLockElement === this.container;
      if (!this.controller.enabled) {
        this.notify_stop();
      }
    };

    ['pointerlockchange', 'mozpointerlockchange', 'webkitpointerlockchange'].forEach(i => {
      document.addEventListener(i, pointerLockChange, false);
    });
  }

  public init_puppet(id: string, bounding_box) {
    if (this.puppets[id]) {
      return;
    }
    const puppet = new Puppet(
      id,
      bounding_box.map(i => i * VOXEL_WIDTH),
      () => this.chunk_data,
    );
    this.puppets[id] = puppet;
    this.scene.add(puppet.get_obj());
  }

  private init_world() {
    const chunk_helper = new THREE.Mesh(
      new THREE.BoxGeometry(
        CHUNK_WIDTH,
        CHUNK_WIDTH,
        CHUNK_WIDTH,
      ),
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
    );
    chunk_helper.position.set(
      CHUNK_WIDTH / 2,
      CHUNK_WIDTH / 2,
      CHUNK_WIDTH / 2,
    );
    this.scene.add(chunk_helper);
  }

  private remove_chunk(chunk_xyz) {
    const id = chunk_xyz_to_chunk_id(chunk_xyz);
    const status = this.chunk_mesh_status[id];
    if (status === CHUNK_MESH_STATUS.NONE) {
      return;
    } else if (status === CHUNK_MESH_STATUS.PENDDING) {
      this.chunk_mesh_to_cancel[id] = true;
    } else if (status === CHUNK_MESH_STATUS.LOADED) {
      this.scene.remove(this.rendered_chunks[id]);
      delete this.rendered_chunks[id];
      this.chunk_mesh_status[id] = CHUNK_MESH_STATUS.NONE;
    }
  }

  private get_adjacent_chunks([x, y, z], h_far = CHUNK_ADJACENT_HORIZONTAL_FAR, v_far = CHUNK_ADJACENT_VERTICAL_FAR) {
    const adjacent = [];
    for (let i = -h_far; i <= h_far; ++i) {
      for (let j = -v_far; j <= v_far; ++j) {
        for (let k = -h_far; k <= h_far; ++k) {
          adjacent.push([i + x, j + y, k + z]);
        }
      }
    }
    return adjacent;
  }

  private chunk_in_range([x1, y1, z1], [x2, y2, z2], h_far = CHUNK_ADJACENT_HORIZONTAL_FAR, v_far = CHUNK_ADJACENT_VERTICAL_FAR) {
    return Math.abs(x1 - x2) <= h_far && Math.abs(y1 - y2) <= v_far && Math.abs(z1 - z2) <= h_far;
  }

  private update_adjacent_chunks(chunk_id) {
    const chunk_xyz = chunk_id_to_chunk_xyz(chunk_id);
    const adjacent_chunks = this.get_adjacent_chunks(chunk_xyz);

    adjacent_chunks.forEach(i => {
      const id = chunk_xyz_to_chunk_id(i);
      if (!this.chunk_data[id]) {
        this.chunk_data[id] = gen_terrain(chunk_xyz_to_world_xyz(i));
      }

      if (
        this.chunk_mesh_status[id] === CHUNK_MESH_STATUS.LOADED ||
        this.chunk_mesh_status[id] === CHUNK_MESH_STATUS.PENDDING
      ) {
        return;
      }

      this.chunk_mesh_status[id] = CHUNK_MESH_STATUS.PENDDING;
      const world_xyz = chunk_xyz_to_world_xyz(i);
      gen_chunk_mesh(id, this.chunk_data[id], this.chunk_mesh_to_cancel).then((chunk_mesh: THREE.Object3D) => {
        this.chunk_mesh_status[id] = CHUNK_MESH_STATUS.LOADED;
        chunk_mesh.position.set(world_xyz[0], world_xyz[1], world_xyz[2]);

        this.chunk_mesh[id] = chunk_mesh;
        this.rendered_chunks[i] = chunk_mesh;
        chunk_mesh.name = id;
        this.scene.add(chunk_mesh);
      }).catch((e) => {
      });
    });

    // remove far chunks
    Object.keys(this.rendered_chunks).forEach(i => {
      const a = chunk_id_to_chunk_xyz(i);
      !this.chunk_in_range(chunk_xyz, a) && this.remove_chunk(a);
    });
  }

  private update_chunk(chunk_id) {
    if (this.chunk_mesh_status[chunk_id] === CHUNK_MESH_STATUS.PENDDING) {
      return;
    }
    this.chunk_mesh_to_cancel[chunk_id] = false;

    this.chunk_mesh_status[chunk_id] = CHUNK_MESH_STATUS.PENDDING;
    const chunk_xyz = chunk_id_to_chunk_xyz(chunk_id);
    const [x, y, z] = chunk_xyz_to_world_xyz(chunk_xyz);
    gen_chunk_mesh(chunk_id, this.chunk_data[chunk_id], this.chunk_mesh_to_cancel).then((chunk_mesh: THREE.Object3D) => {
      this.chunk_mesh_status[chunk_id] = CHUNK_MESH_STATUS.LOADED;
      chunk_mesh.position.set(x, y, z);

      this.chunk_mesh[chunk_id] = chunk_mesh;
      chunk_mesh.name = chunk_id;
      this.remove_chunk(chunk_xyz);
      this.rendered_chunks[chunk_id] = chunk_mesh;
      this.scene.add(chunk_mesh);
    }).catch((e) => {
      console.log(e);
      console.log(chunk_id);
    });
  }

  private update_debug_message() {
    const pos = this.controller.get_position();
    this.debug_dom.innerText = `
      controller world xyz: ${pos.map(i => i.toFixed(3)).toString()},
      controller local voxel xyz: ${world_xyz_to_local_voxel_xyz(pos as WORLD_XYZ).toString()},
      controller world voxel xyz: ${world_xyz_to_voxel_xyz(pos as WORLD_XYZ).toString()},
      chunk id: ${world_xyz_to_chunk_id(pos as WORLD_XYZ).toString()},
      camera world xyz: ${this.camera_world_xyz.map(i => i.toFixed(3)).toString()}
      focused grid world xyz: ${this.focused_voxel.position.toArray().map(i => i.toFixed(3)).toString()}
      camera direction: ${this.controller.getDirection().toArray().map(i => i.toFixed(3)).toString()}
    `;
  }

  render() {
    this.update_camera_world_xyz();
    this.controller.update();
    for (const i in this.puppets) {
      this.puppets[i].update();
    }
    this.changes.forEach((v, chunk_id) => this.update_chunk(chunk_id));
    this.changes.clear();
    this.renderer.render(this.scene, this.camera);
    this.update_focused_voxel();

    this.update_cross();
    this.update_debug_message();
  }

  start(notify_stop) {
    this.notify_stop = notify_stop;
    this.container.requestPointerLock();
  }

  set_focus_mode(mode: FocusMode) {
    if (mode === this.focus_mode) {
      return;
    }
    this.focus_mode = mode;
    (this.focused_voxel.position.set as any)(...this.focused_voxel_world_xyz[FocusMode[this.focus_mode]]);
  }

  set_terrain_fn(fn) {
    terrain_fn = fn;
  }

  get_focused_voxel() {
    return this.focused_voxel_world_xyz[FocusMode[this.focus_mode]];
  }

  set_voxel(position: WORLD_XYZ, material: Material) {
    const chunk_id = world_xyz_to_chunk_id(position);
    if (!this.chunk_data[chunk_id]) {
      this.chunk_data[chunk_id] = gen_terrain(chunk_xyz_to_world_xyz(position));
    }
    this.changes.set(set_voxel(position, material, this.chunk_data), true);
  }
}