import { gen_id, Brick, BrickOutput } from 'froggy';
import { atomicButtonAdd, atomicButtonRemove } from './styles/button.less';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    to_code: Function,
    child_to_code?: {[type: string]: Function},
  },
} = {
  procedure_def: {
    brick_def: {
      type: 'procedure_def',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'procedure def',
          },
        },
        {
          type: 'container',
          output: BrickOutput.string,
          is_static: true,
          inputs: [{
            type: 'atomic_input_string',
            output: BrickOutput.string,
            is_static: true,
            ui: {
              value: 'boost',
            },
          }],
        },
        {
          type: 'atomic_button',
          is_static: true,
          ui: {
            className: atomicButtonAdd,
            value: 'procedure_add_param',
          },
        },
        {
          type: 'atomic_button',
          is_static: true,
          ui: {
            className: atomicButtonRemove,
            value: 'procedure_remove_param',
          },
        },
      ],
      next: null,
      ui: {
        show_hat: true,
      },
    },
    child_to_code: {
      procedure: (brick, util) => {
        const inputs = ['global'].concat(brick.inputs.map(i => `(${util.brick_to_code(i)})`)).join(',');
        return `
          ${util.has_blocking_brick[brick.procedure_name] ? 'await' : ''} global.$procedure_${brick.procedure_name}(${inputs});
          ${util.brick_to_code(brick.next)}
        `;
      },
      procedure_with_output: (brick, util) => {
        const inputs = ['global'].concat(brick.inputs.map(i => `(${util.brick_to_code(i)})`)).join(',');
        return `${util.has_blocking_brick[brick.procedure_name] ? 'await' : ''} global.$procedure_${brick.procedure_name}(${inputs})`;
      },
      atomic_param: (brick) => brick.computed,
    },
    to_code: (brick, util) => {
      return `
        global.$procedure_${brick.procedure_name} = ${util.has_blocking_brick[brick.procedure_name] ? 'async' : ''} function(${['global'].concat(brick.params).join(',')}) {
          ${util.brick_to_code(brick.next)}
        };
      `;
    },
  },
  procedure_return: {
    brick_def: {
      type: 'procedure_return',
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'return',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }],
    },
    to_code: (brick, o) => `return (${o.brick_to_code(brick.inputs[0])});`,
  },
};

const atomic_button_fns = {
  procedure_remove_param: (brick_data, brick, update) => {
    const parent = brick_data[brick.ui.parent];
    if (parent.inputs.length === 4) {
      return;
    }
    parent.inputs.splice(parent.inputs.length - 3, 1);
    if (parent.inputs.length === 5) {
      parent.inputs.splice(parent.inputs.length - 3, 1);
    }
    update();
  },
  procedure_add_param: (brick_data, brick, update) => {
    const parent = brick_data[brick.ui.parent];
    if (parent.inputs.length === 4) {
      parent.inputs.splice(parent.inputs.length - 2, 0, {
        id: gen_id(),
        type: 'atomic_text',
        ui: {
          value: 'params:',
          is_toolbox_brick: parent.ui.is_toolbox_brick,
        },
      });
    }
    const param_name = prompt(`param's name`);
    const id = gen_id();
    parent.inputs.splice(parent.inputs.length - 2, 0, {
      id,
      type: 'container',
      output: BrickOutput.any,
      root: parent.root,
      is_static: true,
      inputs: [{
        id: gen_id(),
        type: 'atomic_param',
        output: BrickOutput.any,
        ui: {
          parent: id,
          is_toolbox_brick: parent.ui.is_toolbox_brick,
          value: param_name,
        },
      }],
      is_decoration: true,
      ui: {
        copier: true,
        is_toolbox_brick: parent.ui.is_toolbox_brick,
        parent: parent.id,
      },
    } as Brick);
    update();
  },
};
export default {
  bricks,
  atomic_button_fns,
};