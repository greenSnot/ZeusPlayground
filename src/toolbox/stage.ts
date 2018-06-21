import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';
import { deep_clone } from '../util';

import * as runtime_mgr from '../runtime_mgr';

const rotation_order = [
  'XYZ',
  'XZY',
  'YXZ',
  'YZX',
  'ZXY',
  'ZYX',
];
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
      inputs: [{
        type: 'atomic_input_number',
        output: BrickOutput.number,
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
      inputs: [{
        type: 'atomic_input_number',
        output: BrickOutput.number,
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
      inputs: [{
        type: 'atomic_input_number',
        output: BrickOutput.number,
        ui: {
          value: 0,
        },
      }],
    },
  ],
};

const entity_def = {
  type: 'stage_3d_get_entity',
  output: BrickOutput.any,
  inputs: [{
    type: 'atomic_text',
    ui: {
      value: 'entity',
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
    to_code: Function,
  },
} = {
  stage_3d_vector3: {
    brick_def: vector3_def,
    to_code: (brick, o) => `[${o.brick_to_code(brick.inputs[0])},${o.brick_to_code(brick.inputs[1])},${o.brick_to_code(brick.inputs[2])}]`,
  },
  stage_3d_operator_vector3: {
    brick_def: {
      type: 'stage_3d_operator_vector3',
      output: BrickOutput.array,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.array,
          inputs: [],
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            type: 'atomic_dropdown',
            is_static: true,
            output: BrickOutput.number,
            ui: {
              value: 1,
              dropdown: 'operator_vector3_dropdown',
            },
          }],
        },
        {
          type: 'container',
          output: BrickOutput.array,
          inputs: [deep_clone(vector3_def)],
        },
      ],
    },
    to_code: (brick, u) => {
      const operator_id = brick.inputs[1].computed;
      const operator = ['*', '+'][operator_id];
      return `(() => {
        let $temp = ${u.brick_to_code(brick.inputs[2])};
        return ${u.brick_to_code(brick.inputs[0])}.map((i, j) => i ${operator} $temp[j]);
      })()`;
    }
  },
  stage_3d_vector_apply_rotation: {
    brick_def: {
      type: 'stage_3d_vector_apply_rotation',
      output: BrickOutput.array,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'vector',
          },
        },
        {
          type: 'container',
          output: BrickOutput.array,
          inputs: [deep_clone(vector3_def)],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'apply rotation',
          },
        },
        {
          type: 'container',
          output: BrickOutput.array,
          inputs: [deep_clone(vector3_def)],
        },
        {
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
        },
      ],
    },
    to_code: (brick, u) => {
      const order = rotation_order[brick.inputs[2].computed];
      return `global.$runtime_mgr.stage.util.vector_apply_rotation(${u.brick_to_code(brick.inputs[0])}, ${u.brick_to_code(brick.inputs[1])}, '${order}')`;
    },
  },
  stage_3d_convert_rotation: {
    brick_def: {
      type: 'stage_3d_convert_rotation',
      output: BrickOutput.array,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'convert rotation',
          },
        },
        {
          type: 'container',
          output: BrickOutput.array,
          inputs: [deep_clone(vector3_def)],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'from',
          },
        },
        {
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
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'to',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            type: 'atomic_dropdown',
            is_static: true,
            output: BrickOutput.number,
            ui: {
              value: 2,
              dropdown: 'rotation_order',
            },
          }],
        },
      ],
    },
    to_code: (brick, u) => {
      const order_a = rotation_order[brick.inputs[1].computed];
      const order_b = rotation_order[brick.inputs[2].computed];
      return `global.$runtime_mgr.stage.util.convert_rotation(${u.brick_to_code(brick.inputs[0])}, '${order_a}', '${order_b}')`;
    }
  },
  stage_3d_get_focused_voxel_position: {
    brick_def: {
      type: 'stage_3d_get_focused_voxel_position',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'focused voxel\'s position',
        },
      }],
    },
    to_code: (brick, o) => '(global.$runtime_mgr.stage.get_focused_voxel_position())',
  },
  stage_3d_controller_get_rotation: {
    brick_def: {
      type: 'stage_3d_controller_get_rotation',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'controller\'s rotation',
        },
      }],
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
          value: 'controller\'s position',
        },
      }],
    },
    to_code: (brick, o) => 'global.$runtime_mgr.stage.controller.get_position()',
  },
  stage_3d_get_entity_position: {
    brick_def: {
      type: 'stage_3d_get_entity_position',
      output: BrickOutput.array,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: `'s position`,
        },
      }],
    },
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}.get_position()`,
  },
  stage_3d_get_entity_world_rotation: {
    brick_def: {
      type: 'stage_3d_get_entity_world_rotation',
      output: BrickOutput.array,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: `'s world rotation`,
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
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}.get_world_rotation('${rotation_order[brick.inputs[1].computed]}')`,
  },
  stage_3d_get_entity_world_position: {
    brick_def: {
      type: 'stage_3d_get_entity_world_position',
      output: BrickOutput.array,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: `'s world position`,
        },
      }],
    },
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}.get_world_position()`,
  },
  stage_3d_get_entity_rotation: {
    brick_def: {
      type: 'stage_3d_get_entity_rotation',
      output: BrickOutput.array,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: `'s rotation`,
        },
      }],
    },
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}.get_rotation()`,
  },
  stage_3d_entity_set_velocity: {
    brick_def: {
      type: 'stage_3d_entity_set_velocity',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'set',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [deep_clone(entity_def)],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'velocity',
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
    to_code: (brick, o) => `(${o.brick_to_code(brick.inputs[0])}).set_velocity(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_entity_change_velocity: {
    brick_def: {
      type: 'stage_3d_entity_change_velocity',
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
          inputs: [deep_clone(entity_def)],
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
    to_code: (brick, o) => `(${o.brick_to_code(brick.inputs[0])}).change_velocity(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_material: {
    brick_def: material_def,
    to_code: (brick, u) => `${u.brick_to_code(brick.inputs[0])}`,
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
    to_code: (brick, o) => `global.$runtime_mgr.stage.set_focus_mode(${brick.inputs[0].computed});${o.brick_to_code(brick.next)}`,
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
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [deep_clone(material_def)],
      }],
      next: null,
    },
    to_code: (brick, o) => `global.$runtime_mgr.stage.set_voxel(${o.brick_to_code(brick.inputs[0])}, ${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_get_entity: {
    brick_def: entity_def,
    to_code: (brick, o) => `global.$runtime_mgr.stage.entities[${o.brick_to_code(brick.inputs[0])}]`,
  },
  stage_3d_set_terrain_generator: {
    brick_def: {
      type: 'stage_3d_set_terrain_generator',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set terrain generator',
        },
      }, {
        type: 'container',
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          ui: {
            value: 'terrain_generator',
          }
        }],
      }],
    },
    to_code: (brick, u) => `
      global.$runtime_mgr.stage.set_terrain_generator(global.$runtime_mgr.get_global_variable('$procedure_' + ${u.brick_to_code(brick.inputs[0])}));
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_translate_entity_by: {
    brick_def: {
      type: 'stage_3d_translate_entity_by',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'translate',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
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
    to_code: (brick, u) => `
      ${u.brick_to_code(brick.inputs[0])}.translate_by(${u.brick_to_code(brick.inputs[1])});
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_translate_entity_by_local: {
    brick_def: {
      type: 'stage_3d_translate_entity_by_local',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'translate',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'by local',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    to_code: (brick, u) => `
      ${u.brick_to_code(brick.inputs[0])}.translate_by_local(${u.brick_to_code(brick.inputs[1])});
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_rotate_entity_by: {
    brick_def: {
      type: 'stage_3d_rotate_entity_by',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'rotate',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
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
    to_code: (brick, u) => `
      ${u.brick_to_code(brick.inputs[0])}.rotate_by(${u.brick_to_code(brick.inputs[1])});
      ${u.brick_to_code(brick.next)};
    `,
  },
  stage_3d_set_entity_rotation_order: {
    brick_def: {
      type: 'stage_3d_set_entity_rotation_order',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
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
    to_code: (brick, u) => {
      const order = rotation_order[brick.inputs[1].computed];
      return `
        ${u.brick_to_code(brick.inputs[0])}.set_rotation_order('${order}');
        ${u.brick_to_code(brick.next)}
      `;
    },
  },
  stage_3d_init_entity: {
    brick_def: {
      type: 'stage_3d_init_entity',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'init entity',
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
    to_code: (brick, o) => `global.$runtime_mgr.stage.init_entity(${o.brick_to_code(brick.inputs[0])},${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_set_entity_collidable: {
    brick_def: {
      type: 'stage_3d_set_entity_collidable',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'collidable',
        },
      }, {
        type: 'container',
        output: BrickOutput.boolean,
        inputs: [{
          type: 'atomic_boolean',
          output: BrickOutput.boolean,
          ui: {
            value: true,
            dropdown: 'atomic_boolean_dropdown',
          },
        }],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.collidable = ${o.brick_to_code(brick.inputs[1])};${o.brick_to_code(brick.next)}`,
  },
  stage_3d_set_entity_air_friction: {
    brick_def: {
      type: 'stage_3d_set_entity_air_friction',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'air friction',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0.08,
          },
        }],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.air_friction = ${o.brick_to_code(brick.inputs[1])};${o.brick_to_code(brick.next)}`,
  },
  stage_3d_set_entity_friction: {
    brick_def: {
      type: 'stage_3d_set_entity_friction',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'friction',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0.08,
          },
        }],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.friction = ${o.brick_to_code(brick.inputs[1])};${o.brick_to_code(brick.next)}`,
  },
  stage_3d_set_entity_mass: {
    brick_def: {
      type: 'stage_3d_set_entity_mass',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'mass',
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
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.mass = ${o.brick_to_code(brick.inputs[1])};${o.brick_to_code(brick.next)}`,
  },
  stage_3d_set_g: {
    brick_def: {
      type: 'stage_3d_set_g',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set G',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 9.806,
          },
        }],
      }],
    },
    to_code: (brick, o) => `
      global.$runtime_mgr.stage.util.set_g(${o.brick_to_code(brick.inputs[0])});
      ${o.brick_to_code(brick.next)}
    `,
  },
  stage_3d_translate_entity_to: {
    brick_def: {
      type: 'stage_3d_translate_entity_to',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'translate',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.translate_to(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_rotate_entity_to: {
    brick_def: {
      type: 'stage_3d_rotate_entity_to',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'rotate',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.rotate_to(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_rotate_controller_to: {
    brick_def: {
      type: 'stage_3d_rotate_controller_to',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'rotate controller to',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    to_code: (brick, u) => `
      global.$runtime_mgr.stage.controller.rotate_to(${u.brick_to_code(brick.inputs[0])});
      ${u.brick_to_code(brick.next)}
    `,
  },
  stage_3d_reset: {
    brick_def: {
      type: 'stage_3d_reset',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'reset',
        },
      }],
    },
    to_code: (brick, util) => `global.$runtime_mgr.stage.reset();${util.brick_to_code(brick.next)}`,
  },
  stage_3d_set_camera_fov: {
    brick_def: {
      type: 'stage_3d_set_camera_fov',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set camera fov',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 40,
          }
        }],
      }],
    },
    to_code: (brick, util) => `global.$runtime_mgr.stage.set_camera_fov(${util.brick_to_code(brick.inputs[0])});${util.brick_to_code(brick.next)}`,
  },
  stage_3d_set_camera_distance: {
    brick_def: {
      type: 'stage_3d_set_camera_distance',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set camera distance',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 1,
          }
        }],
      }],
    },
    to_code: (brick, util) => `global.$runtime_mgr.stage.set_camera_distance(${util.brick_to_code(brick.inputs[0])});${util.brick_to_code(brick.next)}`,
  },
  stage_3d_translate_controller_to: {
    brick_def: {
      type: 'stage_3d_translate_controller_to',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'translate controller to',
        },
      }, {
        type: 'container',
        output: BrickOutput.array,
        inputs: [deep_clone(vector3_def)],
      }],
    },
    to_code: (brick, o) => `global.$runtime_mgr.stage.controller.get_obj().position.fromArray(${o.brick_to_code(brick.inputs[0])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_set_entity_color: {
    brick_def: {
      type: 'stage_3d_set_entity_color',
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'color',
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
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[0])}.set_color(${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_entity_attach_to: {
    brick_def: {
      type: 'stage_3d_entity_attach_to',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'attach to',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[1])}.attach_to(${o.brick_to_code(brick.inputs[0])});${o.brick_to_code(brick.next)}`,
  },
  stage_3d_entity_detach_from: {
    brick_def: {
      type: 'stage_3d_entity_detach_from',
      next: null,
      inputs: [{
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'detach from',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [deep_clone(entity_def)],
      }],
    },
    to_code: (brick, o) => `${o.brick_to_code(brick.inputs[1])}.detach_to(${o.brick_to_code(brick.inputs[0])});${o.brick_to_code(brick.next)}`,
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
  rotation_order: rotation_order.reduce((m, i, index) => {
    m[i] = index;
    return m;
  }, {}),
  operator_vector3_dropdown: {
    scale: 0,
    translate: 1,
  },
};
export default {
  bricks,
  atomic_button_fns,
  atomic_dropdown_menu,
};