import * as runtime_data from './runtime_data';

let animation;
export let is_running = false;

let tick: Function = function() {};
export let stage;

export function set_stage(s) {
  stage = s;
}

export function set_tick_function(func: Function) {
  tick = func;
}

let sleeping_fns = [] as [Function, number][];

export function update() {
  const now = Date.now();
  for (let i = 0; i < sleeping_fns.length; ++i) {
    if (sleeping_fns[i][1] < Date.now()) {
      sleeping_fns[i][0]();
      sleeping_fns.splice(i, 1);
      --i;
    }
  }
  tick();
  runtime_data.dispatch_event('on_updated');
  runtime_data.tick();
  animation = requestAnimationFrame(update);
}

export function get_mouse_status() {
  return runtime_data.mouse_status;
}

export function stop() {
  is_running = false;
  runtime_data.stop();
  cancelAnimationFrame(animation);
  sleeping_fns = [];
}

export function sleep(secs) {
  return new Promise((r) => sleeping_fns.push([r, Date.now() + secs * 1000]));
}

export function start(global = {}) {
  is_running = true;
  runtime_data.start(global);
  runtime_data.dispatch_event('on_run_clicked');
  update();
}

export {
  add_event_listener,
  get_key_status,
  set_global_variable,
  get_global_variable,
  get_global_variables,
} from './runtime_data';
