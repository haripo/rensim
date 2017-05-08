import Immutable, { Map } from 'immutable';
import { fieldCols, fieldRows } from '../utils/constants';

import FieldUtils from '../utils/FieldUtils';

const queueLength = 128;

function generateQueue() {
  let queue = [];
  for (let i = 0; i < queueLength; i++) {
    queue.push([
      Math.floor(Math.random() * 4) + 1,
      Math.floor(Math.random() * 4) + 1
    ]);
  }
  return queue;
}

/**
 * Show highlight on the field
 * @param state
 * @param action
 * @returns new state
 */
function showHighlight(state, action) {
  return state
    .setIn(['highlight', 'row'], action.payload.position.row)
    .setIn(['highlight', 'col'], action.payload.position.col);
}

/**
 * Hide highlight
 * @param state
 * @param action
 * @returns new state
 */
function hideHighlight(state, action) {
  return state
    .setIn(['highlight', 'row'], null)
    .setIn(['highlight', 'col'], null);
}

/**
 * Put pair
 */
function putNextPair(state, action) {
  const stack = state.get('stack');
  const pair = state.get('queue').get(0);

  const { position, direction } = action.payload;
  const positions = FieldUtils.getDropPositions(position, direction, stack);

  if (positions) {
    return state
      .update('queue', q => q.shift().push(pair))
      .updateIn(['stack', positions[0].row, positions[0].col], () => pair.get(0))
      .updateIn(['stack', positions[1].row, positions[1].col], () => pair.get(1));
  }
  return state;
}

function vanishPuyos(state, action) {
  return state.withMutations(s => {
    action.payload.targets.forEach(target => {
      s.updateIn(['stack', target[0], target[1]], () => 0);
    });
  });
}

function applyGravity(state, action) {
  return state.withMutations(s => {
    for (let i = 0; i < fieldCols; i++) {
      for (let j = 0; j < fieldRows; j++) {
        let k = fieldRows - j - 1;
        if (s.getIn(['stack', k, i]) !== 0) continue;
        while (0 <= k && s.getIn(['stack', k, i]) === 0) k--;
        if (0 <= k) {
          s.setIn(['stack', fieldRows - j - 1, i], s.getIn(['stack', k, i]));
          s.setIn(['stack', k, i], 0);
        }
      }
    }
  });
}

const initialState = Map({
  queue: Immutable.fromJS(generateQueue()),
  stack: Immutable.fromJS(FieldUtils.createField(fieldRows, fieldCols)),
  chain: Map({
    count: 0,
    isActive: false
  }),
  highlight: Map({
    row: null,
    col: null,
  })
});

const simulator = (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_HIGHLIGHT':
      return showHighlight(state, action);
    case 'HIDE_HIGHLIGHT':
      return hideHighlight(state, action);
    case 'PUT_NEXT_PAIR':
      return putNextPair(state, action);
    case 'VANISH_PUYOS':
      return vanishPuyos(state, action);
    case 'APPLY_GRAVITY':
      return applyGravity(state, action);
    default:
      return state;
  }
};

/**
 * Selector function to get connected puyos
 * @returns {Array}
 */
export function getConnectedPuyos(state) {
  const stack = state.simulator.get('stack');

  let result = [];
  for (let i = 0; i < fieldRows; i++) {
    for (let j = 0; j < fieldCols; j++) {
      if (stack.getIn([i, j]) !== 0) {
        const count = FieldUtils.getConnectedCount(i, j, stack);
        if (count >= 4) {
          result.push([i, j]);
        }
      }
    }
  }
  return result;
}

export default simulator;