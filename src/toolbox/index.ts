import control from './control';
import data from './data';
import event from './event';
import operator from './operator';
import procedure from './procedure';
import stage from './stage';

import {
  clone,
  for_each_brick,
  Brick,
} from 'froggy';

const categories = {
  control,
  data,
  event,
  operator,
  procedure,
  stage,
};
const map_child = (j, key) => Object.keys(j).reduce(
  (m, i) => {
    m[i] = j[i][key];
    return m;
  },
  {},
);
const flatten = (i) => Object.keys(i).reduce(
  (m, j) => {
    return {...m, ...i[j]};
  },
  {},
);

const init_categories = (c: {[name: string]: {[type: string]: {brick_def: Brick}}}) => {
  return Object.keys(c).reduce(
    (m, category) => {
      const bricks = Object.keys(c[category]).reduce(
        (k, j) => {
          k.push(c[category][j].brick_def);
          return k;
        },
        [],
      );
      const result = [];
      bricks.forEach(i => {
        const brick = clone(i);
        brick.ui.offset.y = brick.ui.show_hat ? (result.length === 0 ? 20 : 30) : 20;
        brick.is_root = true;
        for_each_brick(brick, undefined, j => j.ui.is_toolbox_brick = true);
        result.push(brick);
      });
      m[category] = result;
      return m;
    },
    {},
  );
};

const bricks_bundle = map_child(categories, 'bricks');

export const type_to_code = Object.keys(bricks_bundle).reduce(
  (m, category) => {
    const bundles = bricks_bundle[category];
    Object.keys(bundles).forEach(i => {
      m[i] = bundles[i].to_code;
      if (bundles[i].child_to_code) {
        Object.keys(bundles[i].child_to_code).forEach(j => {
          m[j] = bundles[i].child_to_code[j];
        });
      }
    });
    return m;
  },
  {},
);

export const toolbox = {
  categories: init_categories(map_child(categories, 'bricks')),
  activeCategory: 'data',
};

export const atomic_button_fns = flatten(map_child(categories, 'atomic_button_fns'));
export const atomic_dropdown_menu = flatten(map_child(categories, 'atomic_dropdown_menu'));