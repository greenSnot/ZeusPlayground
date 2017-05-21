let global_variables = {};

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
}

function on_key_up(e) {
  key_status[e.keyCode] = KEY_STATUS.released;
  key_to_be_reset[e.keyCode] = true;
}

export function get_key_status(key_code: number) {
  return key_status[key_code] || KEY_STATUS.none;
}

export function reset() {
  global_variables = {};
  key_status = {};
  Object.keys(mouse_status).forEach(i => mouse_status[i] = MOUSE_STATUS.none);
}

export function stop() {
  document.removeEventListener('keyup', on_key_up, false);
  document.removeEventListener('keydown', on_key_down, false);

  document.removeEventListener('mousedown', on_mouse_down, false);
  document.removeEventListener('mouseup', on_mouse_up, false);
}

// after interpreter
export function tick() {
  Object.keys(key_to_be_reset).forEach(i => key_status[i] = KEY_STATUS.none);
  key_to_be_reset = {};

  Object.keys(mouse_event_to_be_reset).forEach(i => mouse_status[i] = MOUSE_STATUS.none);

  mouse_event_to_be_reset = {};
}

export function on_mouse_up(e) {
  if (e.button === 0) {
    mouse_status.left = MOUSE_STATUS.up;
    mouse_event_to_be_reset['left'] = true;
  } else if (e.button === 2) {
    mouse_status.right = MOUSE_STATUS.up;
    mouse_event_to_be_reset['right'] = true;
  }
}

export function on_mouse_down(e) {
  if (e.button === 0) {
    mouse_status.left = MOUSE_STATUS.down;
  } else if (e.button === 2) {
    mouse_status.right = MOUSE_STATUS.down;
  }
}

export function start() {
  reset();
  document.addEventListener('keyup', on_key_up, false);
  document.addEventListener('keydown', on_key_down, false);

  document.addEventListener('mousedown', on_mouse_down, false);
  document.addEventListener('mouseup', on_mouse_up, false);
}

export function get_global_variable(variable_name) {
  return global_variables[variable_name];
}

export function get_global_variables() {
  return global_variables;
}
export function set_global_variables(v) {
  global_variables = v;
}

export function set_global_variable(variable_name, value) {
  global_variables[variable_name] = value;
}
