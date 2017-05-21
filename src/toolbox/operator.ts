import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';

const num_operator_id_to_fn = [
  (a, b) => a + b,
  (a, b) => a - b,
  (a, b) => a * b,
  (a, b) => a / b,
  (a, b) => Math.pow(a, b),
  (a, b) => a % b,
];
const compare_operator_id_to_fn = [
  (a, b) => a < b,
  (a, b) => a <= b,
  (a, b) => a === b,
  (a, b) => a > b,
  (a, b) => a >= b,
];
const math_operator_id_to_fn = [
  a => Math.abs(a),
  a => Math.round(a),
  a => Math.floor(a),
  a => Math.ceil(a),
  a => Math.sqrt(a),
  a => Math.sin(a),
  a => Math.cos(a),
  a => Math.tan(a),
  a => Math.asin(a),
  a => Math.acos(a),
  a => Math.atan(a),
  a => Math.log(a),
];
const boolean_operator_id_to_fn = [
  (a, b) => a & b,
  (a, b) => a ^ b,
  (a, b) => a | b,
  (a, b) => a << b,
  (a, b) => a >> b,
];

const bricks: {
  [type: string]: {
    brick_def: Brick,
    fn: Function,
    to_code: Function,
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
    fn: (interpreter: Interpreter, [a, operator, b]) => {
      return num_operator_id_to_fn[operator](a, b);
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
    fn: (interpreter: Interpreter, [operator, a]) => {
      return math_operator_id_to_fn[operator](a);
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
    fn: (i, [a, b]) => Math.floor(Math.random() * (b - a + 1)) + a,
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
    fn: (interpreter: Interpreter, [a, b]) => {
      return a + b;
    },
    to_code: (brick, o) => {
      return `(${o.brick_to_code(brick.inputs[0])} + ${o.brick_to_code(brick.inputs[1])})`;
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
    fn: (i, [a, b, c]) => a ? b : c,
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
    fn: (interpreter: Interpreter, [a, operator, b]) => {
      return compare_operator_id_to_fn[operator](a, b);
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
    fn: (interpreter: Interpreter, [a, operator, b]) => {
      return boolean_operator_id_to_fn[operator](a, b);
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
    fn: (i, [value]) => !value,
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