import React from 'react';
import ReactDOM from 'react-dom';
import { config } from './config';
import { Stage3d } from './stage_3d';

import { Brick, Workspace } from 'froggy';
import { compile } from 'froggy-interpreter';

import { atomic_button_fns, atomic_dropdown_menu, toolbox, type_to_code } from './toolbox';

import * as runtime_mgr from './runtime_mgr';

import './styles/index.less';
import styles from './styles/index.less';

import { save_to_file } from './util';

let stage: Stage3d;

const storage_key = 'root_bricks';
const save_to_localstorage = (bricks: Brick[]) => {
  localStorage.setItem(storage_key, JSON.stringify(bricks));
};
const localstorage_root_bricks = JSON.parse(localStorage.getItem(storage_key) || '[]');

const demos = [
  'enderman',
  'roller_coaster',
  'big_wheel',
  'flight_simulator',
];
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
  componentDidMount() {
    if (localstorage_root_bricks.length === 0) {
      import(`../test/${demos[0]}.json`).then(res => {
        this.setState({ root_bricks: res.default, workspace_version: this.state.workspace_version + 1 });
      });
    }
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
              const codes = compile(this.state.root_bricks, type_to_code).codes;
              (new Function('global', codes))(global_variables);

              runtime_mgr.start(global_variables);
              stage.start(
                () => {
                  this.setState({ running: false });
                  runtime_mgr.stop();
                },
                () => runtime_mgr.is_running,
              );
            } else {
              runtime_mgr.stop();
            }
            this.setState({ running });
          }}
        />
        <input className={styles.btnOpen} onChange={(e) => {
          const file = e.currentTarget.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            stage.reset();
            this.setState({
              root_bricks: JSON.parse(reader.result),
              workspace_version: this.state.workspace_version + 1,
            });
          };
          reader.readAsText(file);
        }} type="file"/>
        <button className={styles.btnSave} onClick={() => save_to_file('bricks.json', JSON.stringify(this.state.root_bricks))}>save as</button>
        <select
          className={styles.demoSelect}
          onChange={(e) => {
            const name = e.target.value;
            import(`../test/${name}.json`).then(res => {
              stage.reset();
              this.setState({ root_bricks: res.default, workspace_version: this.state.workspace_version + 1 });
            });
          }}
        >
          {[
            '----load demo----',
            ...demos,
          ].map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <iframe src="https://ghbtns.com/github-btn.html?user=greenSnot&repo=ZeusPlayground&type=star&size=large" className={styles.github} frameBorder="0" scrolling="0" width="80px" height="30px"></iframe>
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
