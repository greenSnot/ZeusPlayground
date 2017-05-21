import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';
import { deep_clone } from '../util';

import * as runtime_mgr from '../runtime_mgr';

const vector3_def = {
  type: 'stage_3d_vector3',
  output: BrickOutput.array,
  inputs: [
    {
      type: 'atomic_text',
      ui: {
        value: 'x',
      },
    },
    {
      type: 'container',
      output: BrickOutput.number,
      is_static: true,
      inputs: [{
        type: 'atomic_input_number',
        output: BrickOutput.number,
        is_static: true,
        ui: {
          value: 1,
        },
      }],
    },
    {
      type: 'atomic_text',
      ui: {
        value: 'y',
      },
    },
    {
      type: 'container',
      output: BrickOutput.number,
      is_static: true,
      inputs: [{
        type: 'atomic_input_number',
        output: BrickOutput.number,
        is_static: true,
        ui: {
          value: 0,
        },
      }],
    },
    {
      type: 'atomic_text',
      ui: {
        value: 'z',
      },
    },
    {
      type: 'container',
      output: BrickOutput.number,
      is_static: true,
      inputs: [{
        type: 'atomic_input_number',
        output: BrickOutput.number,
        is_static: true,
        ui: {
          value: 0,
        },
      }],
    },
  ],
};

const puppet_def = {
  type: 'stage_3d_get_puppet',
  output: BrickOutput.any,
  inputs: [{
    type: 'atomic_text',
    ui: {
      value: 'puppet',
    },
  }, {
    type: 'container',
    output: BrickOutput.string,
    inputs: [{
      type: 'atomic_input_string',
      output: BrickOutput.string,
      ui: {
        value: 'main',
      },
    }],
  }],
};
const material_def = {
  type: 'stage_3d_material',
  output: BrickOutput.number,
  inputs: [{
    type: 'atomic_text',
    ui: {
      value: 'material',
    },
  }, {
    type: 'container',
    output: BrickOutput.number,
    is_static: true,
    inputs: [{
      type: 'atomic_dropdown',
      output: BrickOutput.number,
      is_static: true,
      ui: {
        value: 1,
        dropdown: 'material_dropdown',
      },
    }],
  }],
};

const bricks: {
  [type: string]: {
    brick_def: Brick,
    child_fns?: {[type: string]: Function},
    to_code: Function,
    fn: Function,
  },
} = {
  stage_3d_vector3: {
    brick_def: vector3_def,
    fn: (i, vector) => vector,
    to_code: (brick, o) => `[${o.brick_to_code(brick.inputs[0])},${o.brick_to_code(brick.inputs[1])},${o.brick_to_code(brick.inputs[2])}]`,
  },
  stage_3d_puppet_change_velocity: {
    brick_def: {
      type: 'stage_3d_puppet_change_velocity',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'change',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [deep_clone(puppet_def)],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'velocity by',
          },
        },
        {
          type: 'container',
          output: BrickOutput.array,
          inputs: [deep_clone(vector3_def)],
        },
      ],
      next: null,
    },
    fn: (i, [p, v]) => {
      p.change_velocity(v);
    },
    to_code: (brick, o) => `(${o.brick_to_code(brick.inputs[0])}).change_velocity(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_material: {
    brick_def: material_def,
    fn: (i, [v]) => v,
    to_code: (brick, o) => brick.inputs[0].computed,
  },
  stage_3d_set_focus_mode: {
    brick_def: {
      type: 'stage_3d_set_focus_mode',
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set focus mode',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        is_static: true,
        inputs: [{
          type: 'atomic_dropdown',
          output: BrickOutput.number,
          is_static: true,
          ui: {
            value: 1,
            dropdown: 'focus_mode_dropdown',
          },
        }],
      }],
      next: null,
    },
    fn: (i) => runtime_mgr.stage.set_focus_mode(i.self.inputs[0].computed),
    to_code: (brick, o) => `global.$runtime_mgr.stage.set_focus_mode(${brick.inputs[0].computed});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_get_focused_voxel: {
    brick_def: {
      type: 'stage_3d_get_focused_voxel',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'focused voxel',
        },
      }],
    },
    fn: (i) => runtime_mgr.stage.get_focused_voxel(),
    to_code: (brick, o) => '(global.$runtime_mgr.stage.get_focused_voxel())',
  },
  stage_3d_set_voxel: {
    brick_def: {
      type: 'stage_3d_set_voxel',
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set voxel',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'by',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [deep_clone(material_def)],
      }],
      next: null,
    },
    fn: (i, [p, m]) => runtime_mgr.stage.set_voxel(p, m),
    to_code: (brick, o) => `global.$runtime_mgr.stage.set_focused_voxel(${o.brick_to_code(brick.inputs[0])}, ${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_get_puppet: {
    brick_def: puppet_def,
    fn: (i, [id]) => {
      return runtime_mgr.stage.puppets[id];
    },
    to_code: (brick, o) => `global.$runtime_mgr.stage.puppets[${o.brick_to_code(brick.inputs[0])}]`,
  },
  stage_3d_get_puppet_position: {
    brick_def: {
      type: 'stage_3d_get_puppet_position',
      output: BrickOutput.array,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: `'s position`,
        },
      }],
    },
    fn: (i, [puppet]) => puppet.get_position(),
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}.get_position()`,
  },
  stage_3d_get_puppet_rotation: {
    brick_def: {
      type: 'stage_3d_get_puppet_rotation',
      output: BrickOutput.array,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: `'s rotation`,
        },
      }],
    },
    fn: (i, [puppet]) => puppet.get_rotation(),
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}.get_rotation()`,
  },
  stage_3d_puppet_translate_by: {
    brick_def: {
      type: 'stage_3d_puppet_translate_by',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'translate by',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i, [puppet, v]) => puppet.translate_by(v),
    to_code: (brick, u) => `
      ${u.brick_to_code(brick.inputs[0])}.translate_by(${u.brick_to_code(brick.inputs[1])});
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_puppet_translate_local_by: {
    brick_def: {
      type: 'stage_3d_puppet_translate_local_by',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'translate local by',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i, [puppet, v]) => puppet.translate_local_by(v),
    to_code: (brick, u) => `
      ${u.brick_to_code(brick.inputs[0])}.translate_local_by(${u.brick_to_code(brick.inputs[1])});
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_rotate_puppet_by: {
    brick_def: {
      type: 'stage_3d_rotate_puppet_by',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'rotate',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'by',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i, [puppet, v]) => puppet.rotate_by(v),
    to_code: (brick, u) => `
      ${u.brick_to_code(brick.inputs[0])}.rotate_by(${u.brick_to_code(brick.inputs[1])});
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_set_puppet_rotation_order: {
    brick_def: {
      type: 'stage_3d_set_puppet_rotation_order',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'rotation order',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        is_static: true,
        inputs: [{
          type: 'atomic_dropdown',
          is_static: true,
          output: BrickOutput.number,
          ui: {
            value: 1,
            dropdown: 'rotation_order',
          },
        }],
      }],
    },
    fn: () => {},
    to_code: () => {},
  },
  stage_3d_init_puppet: {
    brick_def: {
      type: 'stage_3d_init_puppet',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'init puppet',
        },
      }, {
        type: 'container',
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          ui: {
            value: 'main',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'bounding box',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i: Interpreter, [id, v]) => {
      runtime_mgr.stage.init_puppet(id, v);
    },
    to_code: (brick, o) => `global.$runtime_mgr.stage.init_puppet(${o.brick_to_code(brick.inputs[0])},${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_puppet_set_mass: {
    brick_def: {
      type: 'stage_3d_puppet_set_mass',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'set mass',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0.02,
          },
        }],
      }],
    },
    fn: (i, [puppet]) => {
      puppet.mass = i.self.inputs[1].computed;
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.mass = ${o.brick_to_code(brick.inputs[1])};${o.brick_to_code(brick.next)}`,
  },
  stage_3d_puppet_set_position: {
    brick_def: {
      type: 'stage_3d_puppet_set_position',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'set position',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i, [puppet, v]) => {
      puppet.set_position(v);
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.set_position(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_puppet_set_rotation: {
    brick_def: {
      type: 'stage_3d_puppet_set_rotation',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'set rotation',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i, [puppet, v]) => {
      puppet.set_rotation(v);
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.set_rotation(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_controller_set_rotation: {
    brick_def: {
      type: 'stage_3d_controller_set_rotation',
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'controller set rotation',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: () => {
      // TODO
    },
    to_code: (brick, o) => '',
  },
  stage_3d_controller_get_rotation: {
    brick_def: {
      type: 'stage_3d_controller_get_rotation',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'controller rotation',
        },
      }],
    },
    fn: () => {
      return runtime_mgr.stage.controller.get_rotation();
    },
    to_code: (brick, o) => 'global.$runtime_mgr.stage.controller.get_rotation()',
  },
  stage_3d_controller_get_position: {
    brick_def: {
      type: 'stage_3d_controller_get_position',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'controller position',
        },
      }],
    },
    fn: () => {
      return runtime_mgr.stage.controller.get_position();
    },
    to_code: (brick, o) => 'global.$runtime_mgr.stage.controller.get_position()',
  },
  stage_3d_controller_set_position: {
    brick_def: {
      type: 'stage_3d_controller_set_position',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'controller set position',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    fn: (i, [v]) => {
      runtime_mgr.stage.controller.getObject().position.fromArray(v);
    },
    to_code: (brick, o) => `global.$runtime_mgr.stage.controller.getObject().position.fromArray(${o.brick_to_code(brick.inputs[0])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_puppet_set_color: {
    brick_def: {
      type: 'stage_3d_puppet_set_color',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'set color',
        },
      }, {
        type: 'container',
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          ui: {
            value: '#ff00ffaa',
          },
        }],
      }],
    },
    fn: (i, [puppet, rgba]) => {
      puppet.set_color(rgba);
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.set_color(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_puppet_add: {
    brick_def: {
      type: 'stage_3d_puppet_add',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'attach to',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(puppet_def)],
      }],
    },
    fn: (i, [puppet_a, puppet_b]) => {
      puppet_b.add(puppet_a);
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[1])}.add(${o.brick_to_code(brick.inputs[0])});${o.brick_to_code(brick.next)}`,
  },
};

const atomic_button_fns = {};
const atomic_dropdown_menu = {
  material_dropdown: {
    air: 0,
    grass: 1,
  },
  focus_mode_dropdown: {
    replacement: 1,
    placement: 2,
  },
  rotation_order: {
    XYZ: 1,
    XZY: 2,
    YXZ: 3,
    YZX: 4,
    ZXY: 5,
    ZYX: 6,
  },
};
export default {
  bricks,
  atomic_button_fns,
  atomic_dropdown_menu,
};