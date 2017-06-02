/**
 * Show highlights
 * @param state
 * @param action
 */
import Immutable, { List, Map, Record } from 'immutable';
import {
  APPLY_GRAVITY,
  CHAIN_FINISHED,
  FINISH_DROPPING_ANIMATIONS,
  FINISH_VANISHING_ANIMATIONS,
  HIDE_HIGHLIGHTS,
  PUT_NEXT_PAIR, RESET_FIELD, RESTART,
  SHOW_HIGHLIGHTS,
  UNDO_FIELD,
  VANISH_PUYOS
} from '../actions/actions';
import { fieldCols, fieldRows } from '../utils/constants';
import FieldUtils from '../utils/FieldUtils';
import { calcChainStepScore } from '../utils/scoreCalculator';
import PendingPair from '../models/PendingPair';

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

const HistoryRecord = Record({
  queue: List(),
  stack: List()
});

function makeHistoryRecord(state) {
  return new HistoryRecord({
    queue: state.get('queue'),
    stack: state.get('stack')
  });
}

function showHighlights(state, action) {
  const { position, direction } = action.payload;
  return state
    .set('pendingPair', new PendingPair(
      position.col,
      direction,
      state.getIn(['queue', 0, 0]),
      state.getIn(['queue', 0, 1])
    ))
}

/**
 * Hide highlights
 * @param state
 * @param action
 * @returns new state
 */
function hideHighlights(state, action) {
  return state
    .set('highlights', List())
    .set('ghosts', List());
}

/**
 * Put pair
 */
function putNextPair(state, action) {
  const stack = state.get('stack');
  const pair = state.get('queue').get(0);

  const positions = getDropPositions(state);

  if (positions) {
    return state
      .update('queue', q => q.shift().push(pair))
      .updateIn(['stack', positions[0].row, positions[0].col], () => pair.get(0))
      .updateIn(['stack', positions[1].row, positions[1].col], () => pair.get(1))
      .update('history', history => history.unshift(makeHistoryRecord(state)))
      .update('pendingPair', pair => pair.resetPosition());
  }

  return state;
}

function vanishPuyos(state, action) {
  const connections = FieldUtils.getConnections(state.get('stack'));
  return state.withMutations(s => {
    connections
      .filter(c => c.puyos.length >= 4)
      .forEach(connection => {
        connection.puyos.forEach(puyo => {
          s.update('vanishingPuyos', puyos => puyos.push({
            row: puyo.row,
            col: puyo.col,
            color: connection.color
          }));
          s.updateIn(['stack', puyo.row, puyo.col], () => 0);
        });
      });
    s.update('chain', chain => chain + 1);
    s.update('score', score => {
      const chain = s.get('chain');
      return (chain === 1 ? 0 : score) + calcChainStepScore(chain, connections);
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
          s.update('droppingPuyos', puyos => {
            return puyos.push(Map({
              row: fieldRows - j - 1,
              col: i,
              altitude: (fieldRows - j - 1) - k
            }));
          });
        }
      }
    }
  });
}

function finishDroppingAnimations(state, action) {
  return state.set('droppingPuyos', List());
}

function finishVanishingAnimations(state, action) {
  return state.set('vanishingPuyos', List());
}

function chainFinished(state, action) {
  return state.set('chain', 0);
}

function undoField(state, action) {
  if (state.get('history').size === 0) {
    return state;
  }
  return state
    .set('queue', state.getIn(['history', 0, 'queue']))
    .set('stack', state.getIn(['history', 0, 'stack']))
    .set('vanishingPuyos', List())
    .set('droppingPuyos', List())
    .update('history', history => history.shift());
}

function resetField(state, action) {
  return initialState
}

function restart(state, action) {
  initialState = createInitialState();
  return initialState
}

function createInitialState() {
  return Map({
    queue: Immutable.fromJS(generateQueue()),
    stack: Immutable.fromJS(FieldUtils.createField(fieldRows, fieldCols)),
    chain: 0,
    score: 0,
    pendingPair: new PendingPair(),
    droppingPuyos: List(),
    vanishingPuyos: List(),
    history: List()
  });
}

let initialState = createInitialState();

const simulator = (state = initialState, action) => {
  switch (action.type) {
    case SHOW_HIGHLIGHTS:
      return showHighlights(state, action);
    case HIDE_HIGHLIGHTS:
      return hideHighlights(state, action);
    case PUT_NEXT_PAIR:
      return putNextPair(state, action);
    case VANISH_PUYOS:
      return vanishPuyos(state, action);
    case APPLY_GRAVITY:
      return applyGravity(state, action);
    case FINISH_DROPPING_ANIMATIONS:
      return finishDroppingAnimations(state, action);
    case FINISH_VANISHING_ANIMATIONS:
      return finishVanishingAnimations(state, action);
    case CHAIN_FINISHED:
      return chainFinished(state, action);
    case UNDO_FIELD:
      return undoField(state, action);
    case RESET_FIELD:
      return resetField(state, action);
    case RESTART:
      return restart(state, action);
    default:
      return state;
  }
};

export function canVanish(state) {
  const stack = state.simulator.get('stack');
  return FieldUtils
      .getConnections(stack)
      .filter(c => c.puyos.length >= 4)
      .length > 0;
}

export function isActive(state) {
  return !(
    state.simulator.get('droppingPuyos').count() > 0 ||
    state.simulator.get('vanishingPuyos').count() > 0
  );
}

export function getGhost(state) {
  const position = getDropPositions(state);
  if (position) {
    return [
      { ...position[0], color: state.getIn(['queue', 0, 0]) },
      { ...position[1], color: state.getIn(['queue', 0, 1]) }
    ]
  } else {
    return [];
  }
}

function getDropPositions(state) {
  const pair = state.get('pendingPair');
  const stack = state.get('stack');

  const getDropRow = (col) => {
    let i = fieldRows - 1;
    while (stack.get(i) && stack.getIn([i, col]) !== 0) {
      i--;
    }
    return i;
  };

  const drop1 = { row: getDropRow(pair.firstCol), col: pair.firstCol };
  const drop2 = { row: getDropRow(pair.secondCol), col: pair.secondCol };
  if (drop1.col === drop2.col && drop1.row === drop2.row) {
    if (pair.direction === 'bottom') {
      drop1.row -= 1;
    } else {
      drop2.row -= 1;
    }
  }
  if (FieldUtils.isValidPosition(drop1) && FieldUtils.isValidPosition(drop2)) {
    return [drop1, drop2];
  }
  return null;
}

export default simulator;