import * as React from 'react';
import * as update from 'react-addons-update';
import * as ReactDOM from 'react-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';

import { Stage3d } from '../src/stage_3d';

injectTapEventPlugin();

let stage: Stage3d;
let animate;
let is_running = false;

function start() {
  is_running = true;
  stage.start(() => {
    is_running = false;
  });
  animate = requestAnimationFrame(update);
}

function update() {
  if (!is_running) {
    cancelAnimationFrame(animate);
    return;
  }
  requestAnimationFrame(update);
  stage.render();
}

function init() {
  ReactDOM.render(
    <div
      id="stage-3d"
      style={
        {
          height: '100%',
          width: '100%',
        }
      }
      onClick={start}
    >
      <div id="stage-debug"/>
      <div id="stage-cross"/>
    </div>,
    document.getElementById('main'));
  stage = new Stage3d();
}

init();