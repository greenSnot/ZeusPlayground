import React from 'react';
import ReactDOM from 'react-dom';
import { config } from './config';
import { Stage3d } from './stage_3d';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { Brick, Workspace } from 'froggy';
import { compile, Interpreter } from 'froggy-interpreter';

import { atomic_button_fns, atomic_dropdown_menu, bricks_fn, toolbox, type_to_code } from './toolbox';

import * as runtime_mgr from './runtime_mgr';

import './styles/index.less';
import styles from './styles/index.less';

let stage: Stage3d;

const storage_key = 'root_bricks';
const save_to_localstorage = (bricks: Brick[]) => {
  localStorage.setItem(storage_key, JSON.stringify(bricks));
};
const localstorage_root_bricks = JSON.parse(localStorage.getItem(storage_key) || '[]');

type Props = {
  root_bricks: any,
  atomic_button_fns: any,
  atomic_dropdown_menu: any,
  toolbox: any,
};
type State = Props & {
  running: boolean,
  workspace_version: number,
};
class Main extends React.Component<Props, State> {
  state = {} as State;
  constructor(p) {
    super(p);
    this.state.root_bricks = p.root_bricks;
    this.state.atomic_button_fns = p.atomic_button_fns;
    this.state.atomic_dropdown_menu = p.atomic_dropdown_menu;
    this.state.toolbox = p.toolbox;
    this.state.workspace_version = 0;
  }
  render() {
    return (<React.Fragment>
      <div className={`${styles.workspaceWrap} ${this.state.running ? '' : styles.active}`}>
        <Workspace
          id="main"
          key={this.state.workspace_version}
          root_bricks={this.state.root_bricks}
          atomic_button_fns={this.state.atomic_button_fns}
          atomic_dropdown_menu={this.state.atomic_dropdown_menu}
          toolbox={this.state.toolbox}
          workspace_on_change={(bricks: Brick[]) => save_to_localstorage(bricks)}
        />
        <div
          className={this.state.running ? styles.btnStop : styles.btnRun}
          onClick={() => {
            const running = !this.state.running;
            if (running) {
              const global_variables = {
                $runtime_mgr: runtime_mgr,
              };
              const compiled_bricks = compile(this.state.root_bricks, {
                global_variables,
                type_to_code,
              });
              global_variables['$procedure_terrain_fn'] && stage.set_terrain_fn(global_variables['$procedure_terrain_fn']);
              console.log(compiled_bricks);
              Object.keys(global_variables).forEach(i => console.log(global_variables[i]));

              runtime_mgr.init(bricks_fn, compiled_bricks.procedures, compiled_bricks.events);
              runtime_mgr.start(global_variables);
              stage.start(() => {
                this.setState({ running: false });
                runtime_mgr.stop();
              });
            } else {
              runtime_mgr.stop();
            }
            this.setState({ running });
          }}
        />
      </div>
      <div id="stage-wrap" className={`${styles.stageWrap} ${this.state.running ? styles.active : ''}`} >
        <div id="stage-3d" className={styles.stage}>
          <div id="stage-debug" className={styles.stageDebug}/>
          <div id="stage-cross" className={styles.stageCross}/>
        </div>
      </div>
    </React.Fragment>);
  }
}

ReactDOM.render(
  <Main
    root_bricks={localstorage_root_bricks}
    atomic_button_fns={atomic_button_fns}
    atomic_dropdown_menu={atomic_dropdown_menu}
    toolbox={toolbox}
  />,
  document.getElementById('main'),
  () => {
    stage = new Stage3d();
    runtime_mgr.set_tick_function(() => stage.render());
    runtime_mgr.set_stage(stage);
  });