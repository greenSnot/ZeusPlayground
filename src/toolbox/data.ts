import { Brick, BrickOutput } from 'froggy';
import { Interpreter } from 'froggy-interpreter';
import * as runtime_mgr from '../runtime_mgr';

const bricks: {
  [type: string]: {
    brick_def: any,
    fn: Function,
    to_code: Function,
  },
} = {
  atomic_boolean: {
    brick_def: {
      type: 'atomic_boolean',
      output: BrickOutput.boolean,
      is_root: true,
      ui: {
        value: true,
        dropdown: 'atomic_boolean_dropdown',
      },
    },
    fn: () => {},
    to_code: (brick) => brick.computed.toString(),
  },
  atomic_input_number: {
    brick_def: {
      type: 'atomic_input_number',
      output: BrickOutput.number,
      is_root: true,
      ui: {
        value: 1,
      },
    },
    fn: () => {},
    to_code: (brick) => brick.computed.toString(),
  },
  atomic_input_string: {
    brick_def: {
      type: 'atomic_input_string',
      is_root: true,
      output: BrickOutput.string,
      ui: {
        value: 'string',
      },
    },
    fn: () => { },
    to_code: (brick) => `'${brick.computed}'`,
  },
  data_empty_array: {
    brick_def: {
      type: 'data_empty_array',
      output: BrickOutput.array,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'empty array',
        },
      }],
      is_root: true,
    },
    fn: () => ([]),
    to_code: () => '[]',
  },
  data_variable_get: {
    brick_def: {
      type: 'data_variable_get',
      output: BrickOutput.any,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'variable',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_static: true,
          is_variable_name: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      return i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
    },
    to_code: (brick, o) => {
      const name = brick.inputs[0].computed;
      return brick.is_global_variable ? `(global.${name})` : `(${name})`;
    },
  },
  data_variable_set: {
    brick_def: {
      type: 'data_variable_set',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set variable',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_variable_name: true,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }],
    },
    fn: (interpreter: Interpreter, [variable_name, value]) => {
      interpreter.self.is_global_variable ? runtime_mgr.set_global_variable(variable_name, value) : interpreter.set_local_variable(variable_name, value);
    },
    to_code: (brick, o) => {
      const name = brick.inputs[0].computed;
      return `${brick.is_global_variable ? `(global.${name})` : `(${name})`} = (${o.brick_to_code(brick.inputs[1])});${o.brick_to_code(brick.next)}`;
    },
  },
  data_variable_append: {
    brick_def: {
      type: 'data_variable_append',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'append',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_variable_name: true,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [thing, name]) => {
      const v = i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
      v.push(thing);
    },
    to_code: (brick, o) => {
      const name = brick.inputs[1].computed;
      return `${brick.is_global_variable ? `(global.${name})` : `(${name})`}.push(${o.brick_to_code(brick.inputs[0])});${o.brick_to_code(brick.next)}`;
    },
  },
  data_variable_get_nth: {
    brick_def: {
      type: 'data_variable_get_nth',
      is_root: true,
      output: BrickOutput.any,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'get',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0,
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'th of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_variable_name: true,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [n, name]) => {
      const v = i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
      return v[n];
    },
    to_code: (brick, o) => {
      const name = brick.inputs[1].computed;
      return `${brick.is_global_variable ? `(global.${name})` : `(${name})`}[${o.brick_to_code(brick.inputs[0])}]`;
    },
  },
  data_variable_remove_nth: {
    brick_def: {
      type: 'data_variable_remove_nth',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'remove',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0,
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'th of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          is_variable_name: true,
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [n, name]) => {
      const v = i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
      v.splice(n, 1);
    },
    to_code: (brick, o) => {
      const name = brick.inputs[1].computed;
      return `${brick.is_global_variable ? `(global.${name})` : `(${name})`}.splice(${o.brick_to_code(brick.inputs[0])}, 1);${o.brick_to_code(brick.next)}`;
    },
  },
  data_variable_set_nth: {
    brick_def: {
      type: 'data_variable_set_nth',
      next: null,
      is_root: true,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'set',
        },
      }, {
        type: 'container',
        output: BrickOutput.number,
        inputs: [{
          type: 'atomic_input_number',
          output: BrickOutput.number,
          ui: {
            value: 0,
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'th of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          is_variable_name: true,
          output: BrickOutput.string,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }, {
        type: 'atomic_text',
        ui: {
          value: 'to',
        },
      }, {
        type: 'container',
        output: BrickOutput.any,
        inputs: [],
      }],
    },
    fn: (i: Interpreter, [n, name, thing]) => {
      const v = i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
      v[n] = thing;
    },
    to_code: (brick, o) => {
      const name = brick.inputs[1].computed;
      return `${brick.is_global_variable ? `(global.${name})` : `(${name})`}[${o.brick_to_code(brick.inputs[0])}] = (${o.brick_to_code(brick.inputs[2])});${o.brick_to_code(brick.next)}`;
    },
  },
  data_variable_length_of: {
    brick_def: {
      type: 'data_variable_length_of',
      is_root: true,
      output: BrickOutput.any,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'length of',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_variable_name: true,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      const v = i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
      return v.length;
    },
    to_code: (brick, o) => {
      const name = brick.inputs[0].computed;
      return `(${brick.is_global_variable ? `(global.${name})` : `(${name})`}.length)`;
    },
  },
  data_variable_pop: {
    brick_def: {
      type: 'data_variable_pop',
      is_root: true,
      output: BrickOutput.any,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'pop',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_variable_name: true,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      const v = i.self.is_global_variable ? runtime_mgr.get_global_variable(name) : i.get_local_variable(name);
      return v.pop();
    },
    to_code: (brick, o) => {
      const name = brick.inputs[0].computed;
      return `(${brick.is_global_variable ? `(global.${name})` : `(${name})`}.pop())`;
    },
  },
  data_variable_declare_local: {
    brick_def: {
      type: 'data_variable_declare_local',
      is_root: true,
      next: null,
      inputs: [{
        type: 'atomic_text',
        ui: {
          value: 'declare local variable',
        },
      }, {
        type: 'container',
        is_static: true,
        output: BrickOutput.string,
        inputs: [{
          type: 'atomic_input_string',
          output: BrickOutput.string,
          is_variable_name: true,
          is_static: true,
          ui: {
            value: 'x',
          },
        }],
      }],
    },
    fn: (i: Interpreter, [name]) => {
      i.declare_local_variable(name);
    },
    to_code: (brick, o) => {
      const name = brick.inputs[0].computed;
      return `let ${brick.is_global_variable ? `global.${name}` : `${name}`};${o.brick_to_code(brick.next)}`;
    },
  },
};

const atomic_button_fns = {};
const atomic_dropdown_menu = {
  atomic_boolean_dropdown: {
    true: true,
    false: false,
  },
};
export default {
  bricks,
  atomic_dropdown_menu,
  atomic_button_fns,
};