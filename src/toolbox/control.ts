import { gen_id, Brick, BrickOutput } from 'froggy';

import { Interpreter } from 'froggy-interpreter';
import { atomicButtonAdd, atomicButtonRemove } from './styles/button.less';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    child_fns?: {[type: string]: Function},
    fn: Function,
    to_code: Function,
  },
} = {
  control_if: {
    brick_def: {
      type: 'control_if',
      id: 'if',
      is_root: true,
      next: null,
      parts: [
        {
          type: 'control_if#if',
          is_static: true,
          next: null,
          inputs: [
            {
              type: 'atomic_text',
              ui: {
                value: 'if',
              },
            },
            {
              type: 'container',
              output: BrickOutput.boolean,
              inputs: [],
            },
            {
              type: 'atomic_button',
              is_static: true,
              ui: {
                className: atomicButtonAdd,
                value: 'control_if_btn_add',
              },
            },
            {
              type: 'atomic_button',
              is_static: true,
              ui: {
                className: atomicButtonRemove,
                value: 'control_if_btn_remove',
              },
            },
          ],
        },
        {
          type: 'control_if#end_if',
          is_static: true,
          inputs: [
            {
              type: 'atomic_text',
              ui: {
                value: 'end if',
              },
            },
          ],
        },
      ],
    },
    fn: (interpreter: Interpreter) => {
      const data = interpreter.get_brick_runtime_data();
      if (data.done) {
        return;
      } else if (!data.evaluation_times) {
        data.index = 0;
        interpreter.step_into_part(0);
      } else if (data.index < interpreter.self.parts.length - 1) {
        data.index++;
        interpreter.step_into_part(data.index);
      }
      data.evaluation_times++;
    },
    child_fns: {
      'control_if#if': (interpreter: Interpreter, [condition]) => {
        if (!condition) {
          interpreter.step_out();
        } else {
          interpreter.get_parent_brick_runtime_data().done = true;
        }
      },
      'control_if#else_if': (interpreter: Interpreter, [condition]) => {
        if (!condition) {
          interpreter.step_out();
        } else {
          interpreter.get_parent_brick_runtime_data().done = true;
        }
      },
      'control_if#else': (interpreter: Interpreter) => {
        interpreter.get_parent_brick_runtime_data().done = true;
      },
      'control_if#end_if': () => {},
    },
    to_code: (brick, o) => {
      return `
        ${brick.parts.map((part, i) => {
          if (i !== 0 && i === brick.parts.length - 1) {
            return '';
          }
          const condition = () => o.brick_to_code(part.inputs[0]);
          const body = () => o.brick_to_code(part.next);
          if (i === 0) {
            return `if (${condition()}) {
              ${body()}
            }`;
          } else {
            return `else ${part.inputs.length ? `if (${condition()})` : `` } {
              ${body()}
            }`;
          }
        }).join('')}
        ${o.brick_to_code(brick.next)}
      `;
    },
  },
  control_wait: {
    brick_def: {
      type: 'control_wait',
      is_root: true,
      next: null,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'wait',
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
            value: 'secs',
          },
        },
      ],
    },
    fn: (interpreter: Interpreter, [secs]) => {
      interpreter.sleep(secs);
    },
    to_code: (brick, util) => `
      await global.$runtime_mgr.sleep(${util.brick_to_code(brick.inputs[0])});
      ${util.brick_to_code(brick.next)}
    `,
  },
  control_repeat_n_times: {
    brick_def: {
      type: 'control_repeat_n_times',
      is_root: true,
      next: null,
      parts: [
        {
          type: 'control_repeat_n_times#condition',
          next: null,
          is_static: true,
          inputs: [
            {
              type: 'atomic_text',
              ui: {
                value: 'repeat',
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
                value: 'times',
              },
            },
          ],
        },
        {
          type: 'control_repeat_n_times#end_repeat',
          is_static: true,
          inputs: [
            {
              type: 'atomic_text',
              ui: {
                value: 'end repeat',
              },
            },
          ],
        },
      ],
    },
    fn: (interpreter: Interpreter) => {
      const data = interpreter.get_brick_runtime_data();
      if (data.evaluation_times === 0) {
        interpreter.step_into_part(0);
      } else if (data.times_left > 0) {
        data.times_left --;
        interpreter.skip_inputs = true;
        interpreter.step_into_part(0);
      }
      data.evaluation_times++;
    },
    child_fns: {
      'control_repeat_n_times#condition': (interpreter: Interpreter, [times]) => {
        const parent_data = interpreter.get_parent_brick_runtime_data();
        if (parent_data.evaluation_times === 1) {
          parent_data.times_left = times - 1;
          if (times === 0) {
            interpreter.step_out();
          }
        }
      },
      'control_repeat_n_times#end_repeat': () => {},
    },
    to_code: (brick, o) => `
      for (let $times = (${o.brick_to_code(brick.parts[0].inputs[0])}), $i = 0; $i < $times; ++$i) {
        ${o.brick_to_code(brick.parts[0].next)}
      }
      ${o.brick_to_code(brick.next)}
    `,
  },
  control_repeat_while: {
    brick_def: {
      type: 'control_repeat_while',
      is_root: true,
      next: null,
      parts: [
        {
          type: 'control_repeat_while#condition',
          is_static: true,
          inputs: [
            {
              type: 'atomic_text',
              ui: {
                value: 'while',
              },
            },
            {
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
            },
          ],
          next: {
            type: 'control_wait',
            next: null,
            inputs: [
              {
                type: 'atomic_text',
                ui: {
                  value: 'wait',
                },
              },
              {
                type: 'container',
                output: BrickOutput.number,
                inputs: [{
                  type: 'atomic_input_number',
                  output: BrickOutput.number,
                  ui: {
                    value: 0.16,
                  },
                }],
              },
              {
                type: 'atomic_text',
                ui: {
                  value: 'secs',
                },
              },
            ],
          },
        },
        {
          type: 'control_repeat_while#end_repeat',
          is_static: true,
          inputs: [
            {
              type: 'atomic_text',
              ui: {
                value: 'end repeat',
              },
            },
          ],
        },
      ],
    },
    fn: (interpreter: Interpreter) => {
      const data = interpreter.get_brick_runtime_data();
      if (!data.evaluation_times) {
        data.evaluation_times++;
        interpreter.step_into_part(0);
      } else if (data.condition) {
        interpreter.step_into_part(0);
      }
    },
    child_fns: {
      'control_repeat_while#condition': (interpreter: Interpreter, [condition]) => {
        const parent_data = interpreter.get_parent_brick_runtime_data();
        parent_data.condition = condition;
        if (!condition) {
          interpreter.step_out();
        }
      },
      'control_repeat_while#end_repeat': () => {},
    },
    to_code: (brick, o) => `while (${o.brick_to_code(brick.parts[0].inputs[0])}) {
      ${o.brick_to_code(brick.parts[0].next)}
    }${o.brick_to_code(brick.next)}`,
  },
  control_break: {
    brick_def: {
      type: 'control_break',
      is_root: true,
      next: null,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'break',
          },
        },
      ],
    },
    fn: (interpreter: Interpreter) => {
      interpreter.break();
    },
    to_code: () => 'break;',
  },
};

const atomic_button_fns = {
  control_if_btn_add: (brick_id_to_data, cfg, update) => {
    const father = brick_id_to_data[cfg.ui.parent];
    const grandpa = brick_id_to_data[father.ui.parent];
    const last2 = grandpa.parts[grandpa.parts.length - 2];
    if (last2.type !== 'control_if#else' || grandpa.parts.length === 2) {
      const id = gen_id();
      grandpa.parts.splice(grandpa.parts.length - 1, 0, {
        id,
        type: 'control_if#else',
        root: cfg.root,
        next: null,
        is_static: true,
        inputs: [{
          id: gen_id(),
          type: 'atomic_text',
          root: cfg.root,
          ui: {
            delegate: id,
            is_toolbox_brick: grandpa.ui.is_toolbox_brick,
            offset: { x: 0, y: 0 },
            value: 'else',
            parent: id,
          },
        }],
        ui: {
          delegate: grandpa.id,
          offset: { x: 0, y: 0 },
          is_toolbox_brick: grandpa.ui.is_toolbox_brick,
          parent: grandpa.id,
        },
      });
    } else {
      last2.type = 'control_if#else_if';
      last2.inputs[0].ui.value = 'else if';
      last2.inputs.push({
        id: gen_id(),
        type: 'container',
        output: BrickOutput.boolean,
        inputs: [],
        root: cfg.root,
        ui: {
          delegate: last2.id,
          is_toolbox_brick: grandpa.ui.is_toolbox_brick,
          offset: { x: 0, y: 0 },
          value: ' if',
          parent: last2.id,
        },
      });
    }
    update();
  },
  control_if_btn_remove: (brick_id_to_data, cfg, update) => {
    const father = brick_id_to_data[cfg.ui.parent];
    const grandpa = brick_id_to_data[father.ui.parent];
    const last2 = grandpa.parts[grandpa.parts.length - 2];
    if (last2.type !== 'control_if#else_if') {
      if (grandpa.parts.length > 2) {
        grandpa.parts.splice(grandpa.parts.length - 2, 1);
      }
    } else {
      last2.type = 'control_if#else';
      last2.inputs[0].ui.value = 'else';
      last2.inputs.splice(1, 1);
    }
    update();
  },
};
const atomic_dropdown_menu = {};
export default {
  bricks,
  atomic_dropdown_menu,
  atomic_button_fns,
};