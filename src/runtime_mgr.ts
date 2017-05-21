import { Brick, Interpreter } from 'froggy-interpreter';
import * as runtime_data from './runtime_data';

type InterpreterMap = {
  [id: string]: Interpreter;
};

let interpreters: InterpreterMap;
let roots_needing_dispose;

let animation;
export let stage;

let tick: Function = function() {};
export function init(bricks_fn, procedures, root_bricks: Brick[]) {
  roots_needing_dispose = [];
  interpreters = {};
  for (let i = 0; i < root_bricks.length; ++i) {
    interpreters[root_bricks[i].id] = new Interpreter(bricks_fn, procedures, root_bricks[i]);
  }
}

export function set_tick_function(func: Function) {
  tick = func;
}

export function set_stage(s) {
  stage = s;
}

export function update() {
  for (let i = 0; i < roots_needing_dispose.length; ++i) {
    delete(interpreters[roots_needing_dispose[i]]);
  }

  if (!Object.keys(interpreters).length) {
    stop();
    return;
  }
  for (const i in interpreters) {
    interpreters[i].step();
    if (!interpreters[i].self && !interpreters[i].call_stack.length) {
      dispose_root(i);
    }
  }
  tick();
  runtime_data.tick();
  animation = requestAnimationFrame(update);
}

export function dispose_root(root_id) {
  const interpreter = interpreters[root_id];
  if (!interpreter) {
    return;
  }
  roots_needing_dispose.push(root_id);
  delete(interpreters[root_id]);
}

export function get_global_variables() {
  return runtime_data.get_global_variables();
}
export function get_global_variable(name: string) {
  return runtime_data.get_global_variable(name);
}
export function set_global_variable(name: string, value) {
  runtime_data.set_global_variable(name, value);
}

export function get_key_status(key_code: number) {
  return runtime_data.get_key_status(key_code);
}

export function get_mouse_status() {
  return runtime_data.mouse_status;
}

export function stop() {
  const e = new Event('finished');
  dispatchEvent(e);
  runtime_data.stop();
  cancelAnimationFrame(animation);
}

export function start(override_global_variables?) {
  runtime_data.start();
  if (override_global_variables) {
    runtime_data.set_global_variables(override_global_variables);
  }
  update();
}
