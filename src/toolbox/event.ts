import * as keycode from 'keycode';

import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';
import * as runtime_mgr from '../runtime_mgr';

import { MOUSE_STATUS } from '../runtime_data';
import { atomicButtonRun } from './styles/button.less';

const match_mouse_status = [
  (status) => {},
  (status) => status.left === MOUSE_STATUS.up,
  (status) => status.left === MOUSE_STATUS.down,
  (status) => status.right === MOUSE_STATUS.up,
  (status) => status.right === MOUSE_STATUS.down,
];

const bricks: {
  [type: string]: {
    brick_def: Brick,
    to_code: Function,
  },
} = {
  event_on_update: {
    brick_def: {
      type: 'event_on_update',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when updated',
          },
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    to_code: (brick, util) => {
      return `
        global.$runtime_mgr.add_event_listener('on_updated', async (global) => {
          ${util.brick_to_code(brick.next)}
        });
      `;
    },
  },
  event_run_on_click: {
    brick_def: {
      id: 'event_run_on_click',
      type: 'event_run_on_click',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when',
          },
        },
        {
          type: 'atomic_button',
          ui: {
            className: atomicButtonRun,
          },
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'clicked',
          },
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    to_code: (brick, util) => {
      return `
        global.$runtime_mgr.add_event_listener('on_run_clicked', async (global) => {
          ${util.brick_to_code(brick.next)}
          return true;
        });
      `;
    },
  },
  sensor_mouse: {
    brick_def: {
      type: 'sensor_mouse',
      output: BrickOutput.boolean,
      inputs: [{
        type: 'container',
        output: BrickOutput.number,
        is_static: true,
        inputs: [{
          type: 'atomic_dropdown',
          output: BrickOutput.number,
          is_static: true,
          ui: {
            value: 2,
            dropdown: 'sensor_mouse_kinds_dropdown',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'mouse',
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
            value: 2,
            dropdown: 'sensor_mouse_status_dropdown',
          },
        }],
      }],
      is_root: true,
    },
    to_code: (brick, o) => `(global.$runtime_mgr.get_mouse_status().${brick.inputs[0].computed === 1 ? 'left' : 'right'} === (${brick.inputs[1].computed}))`,
  },
  sensor_key: {
    brick_def: {
      type: 'sensor_key',
      is_root: true,
      output: BrickOutput.boolean,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              is_static: true,
              output: BrickOutput.number,
              ui: {
                value: 65,
                dropdown: 'sensor_key_dropdown',
              },
            },
          ],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'is',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              output: BrickOutput.number,
              is_static: true,
              ui: {
                value: 2,
                dropdown: 'sensor_key_status_dropdown',
              },
            },
          ],
        },
      ],
    },
    to_code: (brick, o) => `(global.$runtime_mgr.get_key_status(${brick.inputs[0].computed}) === ${brick.inputs[1].computed})`,
  },
  event_mouse: {
    brick_def: {
      type: 'event_mouse',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              output: BrickOutput.number,
              is_static: true,
              ui: {
                value: 2,
                dropdown: 'sensor_mouse_all_status_dropdown',
              },
            },
          ],
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    to_code: (brick, util) => `
      global.$runtime_mgr.add_event_listener('on_${brick.inputs[0].computed < 3 ? 'left' : 'right' }_mouse_${brick.inputs[0].computed % 2 ? 'up' : 'down'}', async (global) => {
        ${util.brick_to_code(brick.next)}
      });`,
  },
  event_key: {
    brick_def: {
      type: 'event_key',
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'when',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [
            {
              type: 'atomic_dropdown',
              output: BrickOutput.number,
              is_static: true,
              ui: {
                value: 65,
                dropdown: 'sensor_key_dropdown',
              },
            },
          ],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'is',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            is_static: true,
            type: 'atomic_dropdown',
            output: BrickOutput.number,
            ui: {
              value: 2,
              dropdown: 'sensor_key_status_dropdown',
            },
          }],
        },
      ],
      ui: {
        show_hat: true,
      },
      next: null,
    },
    to_code: (brick, util) => `
      global.$runtime_mgr.add_event_listener('on_key_${brick.inputs[0].computed}_${brick.inputs[1].computed === 1 ? 'down' : 'up'}', async (global) => {
        ${util.brick_to_code(brick.next)}
      });`,
  },
};

const atomic_button_fns = {
  undefined: () => {},
};

const atomic_dropdown_menu = {
  sensor_mouse_kinds_dropdown: {
    left: 1,
    right: 2,
  },
  sensor_mouse_status_dropdown: {
    'down': 1,
    'up': 2,
  },
  sensor_key_status_dropdown: {
    'pressed': 1,
    'released': 2,
  },
  sensor_key_dropdown: (() => {
    const key_ranges = [
      ['a', 'z'],
      ['0', '9'],
    ];
    function flatten(arr) {
      const res = [];
      for (let i = 0; i < arr.length; ++i) {
        if (arr[i].length) { // isArray
          res.push(...arr[i]);
        } else {
          res.push(arr[i]);
        }
      }
      return res;
    }
    const keyboard_keys = flatten(
      key_ranges.map(
        i => (
          new Array(i[1].charCodeAt(0) - i[0].charCodeAt(0) + 1) as any)
            .fill(undefined)
            .map((j, idx) => String.fromCharCode(idx + i[0].charCodeAt(0)),
        ),
      ),
    ).concat([
      'space',
      'left',
      'up',
      'right',
      'down',
    ]);
    return keyboard_keys.reduce(
      (m, i) => {
        m[i] = keycode.codes[i];
        return m;
      },
      {},
    );
  })(),
  sensor_mouse_all_status_dropdown: {
    'left mouse up': 1,
    'left mouse down': 2,
    'right mouse up': 3,
    'right mouse down': 4,
  },
};
export default {
  bricks,
  atomic_button_fns,
  atomic_dropdown_menu,
};