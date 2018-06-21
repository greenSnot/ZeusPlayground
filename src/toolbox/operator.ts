import { Brick, BrickOutput } from 'froggy';

const bricks: {
  [type: string]: {
    brick_def: Brick,
    to_code: Function,
    child_to_code?: {[type: string]: Function},
  },
} = {
  operator_number: {
    brick_def: {
      type: 'operator_number',
      output: BrickOutput.number,
      is_root: true,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.number,
          inputs: [],
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            type: 'atomic_dropdown',
            output: BrickOutput.number,
            is_static: true,
            ui: {
              value: 1,
              dropdown: 'operator_number_dropdown',
            },
          }],
        },
        {
          type: 'container',
          output: BrickOutput.number,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => {
      const operator_id_to_str = ['+', '-', '*', '/', ',', '%'];
      const operator_id = brick.inputs[1].computed;
      const res = `(${o.brick_to_code(brick.inputs[0])} ${operator_id_to_str[operator_id]} ${o.brick_to_code(brick.inputs[2])})`;
      if (operator_id === 4) {
        return `(Math.pow${res})`;
      }
      return res;
    },
    child_to_code: {
      atomic_dropdown: (brick) => {
        return typeof brick.computed === 'string' ? `'${brick.computed}'` : brick.computed;
      },
    },
  },
  operator_math: {
    brick_def: {
      type: 'operator_math',
      id: 'math',
      output: BrickOutput.number,
      is_root: true,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            type: 'atomic_dropdown',
            output: BrickOutput.number,
            is_static: true,
            ui: {
              value: 1,
              dropdown: 'operator_math_dropdown',
            },
          }],
        },
        {
          type: 'container',
          output: BrickOutput.number,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => {
      const operator_id_to_str = ['abs', 'round', 'floor', 'ceil', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log'];
      return `(Math.${operator_id_to_str[brick.inputs[0].computed]}(${o.brick_to_code(brick.inputs[1])}))`;
    },
  },
  operator_random: {
    brick_def: {
      type: 'operator_random',
      output: BrickOutput.number,
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'random from',
          },
        },
        {
          type: 'container',
          output: BrickOutput.number,
          inputs: [],
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
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => `(() => {
      let $a = (${o.brick_to_code(brick.inputs[0])});
      let $b = (${o.brick_to_code(brick.inputs[1])});
      return Math.floor(Math.random() * ($b - $a + 1)) + $a;
    })()`,
  },
  operator_concat_string: {
    brick_def: {
      type: 'operator_concat_string',
      output: BrickOutput.string,
      is_root: true,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.string,
          inputs: [],
        },
        {
          type: 'atomic_text',
          ui: {
            value: 'concat',
          },
        },
        {
          type: 'container',
          output: BrickOutput.string,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => {
      return `(${o.brick_to_code(brick.inputs[0])} + ${o.brick_to_code(brick.inputs[1])})`;
    },
  },
  script: {
    brick_def: {
      type: 'script',
      output: BrickOutput.any,
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'exec',
          },
        },
        {
          type: 'container',
          output: BrickOutput.string,
          inputs: [{
            type: 'atomic_input_string',
            output: BrickOutput.string,
            is_static: true,
            ui: {
              value: '1+3',
            },
          }],
        },
      ],
    },
    to_code: (brick, o) => {
      let script = o.brick_to_code(brick.inputs[0]);
      script = script.substr(1);
      script = script.substr(0, script.length - 1);
      script = script.replace(/[_a-zA-Z][_a-zA-Z0-9]*/g, (match) => Math[match] ? `Math.${match}` :
        `((() => {try { return ${match} } catch (_e) { return global.${match} }})())`);
      return `(${script})`;
    },
  },
  operator_ternary: {
    brick_def: {
      type: 'operator_ternary',
      output: BrickOutput.any,
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'ternary',
          },
        },
        {
          type: 'container',
          output: BrickOutput.boolean,
          inputs: [],
        },
        {
          type: 'atomic_text',
          ui: {
            value: '?',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
        {
          type: 'atomic_text',
          ui: {
            value: ':',
          },
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => `(${o.brick_to_code(brick.inputs[0])} ? ${o.brick_to_code(brick.inputs[1])} : ${o.brick_to_code(brick.inputs[2])})`,
  },
  operator_compare: {
    brick_def: {
      type: 'operator_compare',
      output: BrickOutput.boolean,
      is_root: true,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            type: 'atomic_dropdown',
            output: BrickOutput.number,
            is_static: true,
            ui: {
              value: 1,
              dropdown: 'operator_compare_dropdown',
            },
          }],
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => {
      const operator_id_to_str = ['<', '<=', '===', '>', '>='];
      const operator_id = brick.inputs[1].computed;
      const res = `(${o.brick_to_code(brick.inputs[0])} ${operator_id_to_str[operator_id]} ${o.brick_to_code(brick.inputs[2])})`;
      return res;
    },
  },
  operator_boolean: {
    brick_def: {
      type: 'operator_boolean',
      output: BrickOutput.any,
      is_root: true,
      inputs: [
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
        {
          type: 'container',
          output: BrickOutput.number,
          is_static: true,
          inputs: [{
            type: 'atomic_dropdown',
            output: BrickOutput.number,
            is_static: true,
            ui: {
              value: 1,
              dropdown: 'operator_boolean_dropdown',
            },
          }],
        },
        {
          type: 'container',
          output: BrickOutput.any,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => {
      const operator_id_to_str = ['&', '|', '^', '|', '<<', '>>'];
      return `((${o.brick_to_code(brick.inputs[0])}) ${operator_id_to_str[brick.inputs[2].computed]} (${o.brick_to_code(brick.inputs[2])}))`;
    },
  },
  operator_not: {
    brick_def: {
      type: 'operator_not',
      output: BrickOutput.boolean,
      is_root: true,
      inputs: [
        {
          type: 'atomic_text',
          ui: {
            value: 'not',
          },
        },
        {
          type: 'container',
          output: BrickOutput.boolean,
          inputs: [],
        },
      ],
    },
    to_code: (brick, o) => `(!${o.brick_to_code(brick.inputs[0])})`,
  },
};

const atomic_button_fns = {};
const atomic_dropdown_menu = {
  operator_number_dropdown: {
    '+': 0,
    '-': 1,
    'x': 2,
    '÷': 3,
    '^': 4,
    'mod': 5,
  },
  operator_compare_dropdown: {
    '<': 0,
    '<=': 1,
    '=': 2,
    '>': 3,
    '>=': 4,
  },
  operator_math_dropdown: {
    abs: 0,
    round: 1,
    floor: 2,
    ceiling: 3,
    sqrt: 4,
    sin: 5,
    cos: 6,
    tan: 7,
    asin: 8,
    acos: 9,
    atan: 10,
    log: 11,
  },
  operator_boolean_dropdown: {
    'and': 0,
    'xor': 1,
    'or': 2,
    'shift left': 3,
    'shift right': 4,
  },
};
export default {
  bricks,
  atomic_button_fns,
  atomic_dropdown_menu,
};