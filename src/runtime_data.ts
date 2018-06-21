export enum ListenerStatus {
  idle,
  running,
}

export type Listener = {
  status: ListenerStatus,
  fn: Function,
};

export type Events = {
  [event_name: string]: Listener[],
};

let global_variables = {};

let runtime_events: Events = {};
let repeat_events = {};

export enum KEY_STATUS {
  none = 0,
  pressed = 1,
  released = 2,
}

export enum MOUSE_STATUS {
  none = 0,
  down = 1,
  up = 2,
}

export const mouse_status = {
  left: MOUSE_STATUS.none,
  right: MOUSE_STATUS.none,
};
let mouse_event_to_be_reset = {};

let key_status = {};
let key_to_be_reset = {};

function on_key_down(e) {
  key_status[e.keyCode] = KEY_STATUS.pressed;
  dispatch_event(`on_key_${e.keyCode}_down`);
  repeat_events[`on_key_${e.keyCode}_down`] = true;
}

function on_key_up(e) {
  key_status[e.keyCode] = KEY_STATUS.released;
  key_to_be_reset[e.keyCode] = true;
  dispatch_event(`on_key_${e.keyCode}_up`);
  delete repeat_events[`on_key_${e.keyCode}_down`];
}

export function get_key_status(key_code: number) {
  return key_status[key_code] || KEY_STATUS.none;
}

export function reset() {
  repeat_events = {};
  global_variables = {};
  key_status = {};
  runtime_events = {};
  Object.keys(mouse_status).forEach(i => mouse_status[i] = MOUSE_STATUS.none);
}

export function stop() {
  reset();
  document.removeEventListener('keyup', on_key_up, false);
  document.removeEventListener('keydown', on_key_down, false);

  document.removeEventListener('mousedown', on_mouse_down, false);
  document.removeEventListener('mouseup', on_mouse_up, false);
}

// after interpreter
export function tick() {
  Object.keys(repeat_events).forEach(i => dispatch_event(i));
  Object.keys(key_to_be_reset).forEach(i => key_status[i] = KEY_STATUS.none);
  key_to_be_reset = {};

  Object.keys(mouse_event_to_be_reset).forEach(i => mouse_status[i] = MOUSE_STATUS.none);

  mouse_event_to_be_reset = {};
}

export function on_mouse_up(e) {
  if (e.button === 0) {
    mouse_status.left = MOUSE_STATUS.up;
    mouse_event_to_be_reset['left'] = true;
    dispatch_event(`on_left_mouse_up`);
    delete repeat_events['on_left_mouse_down'];
  } else if (e.button === 2) {
    mouse_status.right = MOUSE_STATUS.up;
    mouse_event_to_be_reset['right'] = true;
    dispatch_event(`on_right_mouse_up`);
    delete repeat_events['on_right_mouse_down'];
  }
}

export function on_mouse_down(e) {
  if (e.button === 0) {
    mouse_status.left = MOUSE_STATUS.down;
    dispatch_event(`on_left_mouse_down`);
    repeat_events['on_left_mouse_down'] = true;
  } else if (e.button === 2) {
    mouse_status.right = MOUSE_STATUS.down;
    dispatch_event(`on_right_mouse_down`);
    repeat_events['on_right_mouse_down'] = true;
  }
}

export function start(global = {}) {
  global_variables = global;
  document.addEventListener('keyup', on_key_up, false);
  document.addEventListener('keydown', on_key_down, false);

  document.addEventListener('mousedown', on_mouse_down, false);
  document.addEventListener('mouseup', on_mouse_up, false);
}

export function get_global_variable(variable_name) {
  return global_variables[variable_name];
}

export function set_global_variable(variable_name, value) {
  global_variables[variable_name] = value;
}

export function get_global_variables() {
  return global_variables;
}

export const add_event_listener = (event_name, fn) => {
  if (!runtime_events[event_name]) {
    runtime_events[event_name] = [];
  }
  console.log(event_name);
  console.log(fn);
  runtime_events[event_name].push({
    status: ListenerStatus.idle,
    fn,
  });
};

export function dispatch_event(name) {
  const listeners = runtime_events[name];
  if (!listeners) {
    return;
  }
  for (let i = 0; i < listeners.length; ++i) {
    if (listeners[i].status === ListenerStatus.running) {
      continue;
    }
    listeners[i].status = ListenerStatus.running;
    ((listener: Listener) => listener.fn(global_variables).then(
      (needs_dispose) => {
        if (needs_dispose) {
          remove_event_listener(name, listener.fn);
        } else {
          listener.status = ListenerStatus.idle;
        }
      },
    ))(listeners[i]);
  }
}

export function remove_event_listener(name, fn) {
  const listeners = runtime_events[name];
  for (let i = 0; i < listeners.length; ++i) {
    if (listeners[i] === fn) {
      listeners.splice(i, 1);
      return;
    }
  }
}
