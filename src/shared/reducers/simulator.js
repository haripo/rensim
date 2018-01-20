import Immutable, { List, Map, Record } from 'immutable';
import {
  INITIALIZE_SIMULATOR,
  APPLY_GRAVITY,
  FINISH_DROPPING_ANIMATIONS,
  FINISH_VANISHING_ANIMATIONS,
  MOVE_HIGHLIGHTS_LEFT,
  MOVE_HIGHLIGHTS_RIGHT,
  PUT_NEXT_PAIR,
  RESET_FIELD,
  RESTART,
  ROTATE_HIGHLIGHTS_LEFT,
  ROTATE_HIGHLIGHTS_RIGHT,
  SHOW_HIGHLIGHTS,
  UNDO_FIELD,
  VANISH_PUYOS
} from '../actions/actions';
import PendingPair from '../models/PendingPair';
import { fieldCols, fieldRows } from '../utils/constants';
import FieldUtils from '../utils/FieldUtils';
import { loadLastState, saveLastState } from '../../shared/utils/StorageService';
import { calcChainStepScore } from '../utils/scoreCalculator';
import { getDropPositions } from '../selectors/simulatorSelectors';


const HistoryRecord = Record({
  queue: List(),
  stack: List(), // TODO: stack and queue are redundant
  chain: 0,
  score: 0,
  chainScore: 0,
});


function makeHistoryRecord(state) {
  return new HistoryRecord({
    queue: state.get('queue'),
    stack: state.get('stack'),
    chain: state.get('chain'),
    score: state.get('score'),
    chainScore: state.get('chainScore')
  });
}

function showHighlights(state, action) {
  let { position, rotation } = action.payload;

  if (position.col === 0 && rotation === 'left') {
    position.col = 1;
  }

  if (position.col === 5 && rotation === 'right') {
    position.col = 4;
  }

  return state
    .set('pendingPair', new PendingPair(
      position.col,
      rotation,
      state.getIn(['queue', 0, 0]),
      state.getIn(['queue', 0, 1])
    ));
}

function rotateHighlightsLeft(state, action) {
  return state.update('pendingPair', pair => pair.rotateLeft());
}

function rotateHighlightsRight(state, action) {
  return state.update('pendingPair', pair => pair.rotateRight());
}

function moveHighlightsLeft(state, action) {
  return state.update('pendingPair', pair => pair.moveLeft());
}

function moveHighlightsRight(state, action) {
  return state.update('pendingPair', pair => pair.moveRight());
}

/**
 * Put pair
 */
function putNextPair(state, action) {
  const pair = state.get('queue').get(0);

  const positions = getDropPositions(state);

  if (positions.length === 0) {
    return state;
  }

  return state.withMutations(s => {
    for (let i = 0; i < positions.length; i++) {
      s.updateIn(['stack', positions[i].row, positions[i].col], () => positions[i].color)
    }
    return s
      .update('queue', q => q.shift().push(pair))
      .update('history', history => history.unshift(makeHistoryRecord(state)))
      .update('moves', moves => moves.unshift(Immutable.fromJS({ move: state.get('pendingPair'), pair: pair })))
      .update('pendingPair', pair => pair.resetPosition())
      .set('isDropOperated', true);
  });
}

function vanishPuyos(state, action) {
  const connections = FieldUtils
    .getConnections(state.get('stack'))
    .filter(c => c.puyos.length >= 4);

  if (connections.length === 0) {
    // save current state
    // TODO: Redux として正しいか？
    //saveLastState(makeHistoryRecord(state));
    return state;
  }

  if (state.get('isDropOperated')) {
    state = state
      .set('isDropOperated', false)
      .set('chain', 0)
      .set('chainScore', 0);
  }

  return state.withMutations(s => {
    const chain = s.get('chain');
    const additionalScore = calcChainStepScore(chain + 1, connections);
    console.log(chain, connections, additionalScore);

    connections
      .forEach(connection => {
        connection.puyos.forEach(puyo => {
          s.update('vanishingPuyos', puyos => puyos.push(Map({
            row: puyo.row,
            col: puyo.col,
            color: connection.color
          })));
          s.updateIn(['stack', puyo.row, puyo.col], () => 0);
        });
      });
    s.update('chain', chain => chain + 1);
    s.update('score', score => score + additionalScore);
    s.update('chainScore', score => score + additionalScore);
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
          const target = s.getIn(['stack', k, i]);
          s.setIn(['stack', fieldRows - j - 1, i], target);
          s.setIn(['stack', k, i], 0);
          s.update('droppingPuyos', puyos => {
            return puyos.push(Map({
              row: fieldRows - j - 1,
              col: i,
              color: target,
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

function revertFromRecord(state, record) {
  return state.withMutations(s => {
    return s
      .set('queue', record.get('queue'))
      .set('stack', record.get('stack'))
      .set('chain', record.get('chain'))
      .set('score', record.get('score'))
      .set('chainScore', record.get('chainScore'))
  });
}

function undoField(state, action) {
  if (state.get('history').size === 0) {
    return state;
  }
  return state.withMutations(s => {
    const record = state.getIn(['history', 0]);
    return revertFromRecord(s, record)
      .set('vanishingPuyos', List())
      .set('droppingPuyos', List())
      .update('history', history => history.shift())
      .update('moves', moves => moves.shift());
  })
}

function resetField(state, action) {
  while (state.get('history').size > 0) {
    state = undoField(state, null)
  }
  return state;
}

function restart(state, action, config) {
  return createInitialState(config);
}

function createInitialState(config) {
  const queue = FieldUtils.generateQueue(config);
  return Map({
    queue: Immutable.fromJS(queue),
    stack: Immutable.fromJS(FieldUtils.createField(fieldRows, fieldCols)),
    chain: 0,
    chainScore: 0,
    score: 0,
    isDropOperated: false,
    pendingPair: new PendingPair(queue[0][0], queue[0][1]),
    droppingPuyos: List(),
    vanishingPuyos: List(),
    history: List(),
    moves: List()
  });
}

function loadOrCreateInitialState(config) {
  let record = loadLastState();
  if (record) {
    // revert last state
    let state = createInitialState(config);
    return revertFromRecord(state, Immutable.fromJS(record))
  } else {
    return createInitialState(config);
  }
}

export function getInitialState(config) {
  return loadOrCreateInitialState(config);
};

export const reducer = (state, action, config) => {
  switch (action.type) {
    case INITIALIZE_SIMULATOR:
      return state; // not implemented
    case SHOW_HIGHLIGHTS:
      return showHighlights(state, action);
    case ROTATE_HIGHLIGHTS_LEFT:
      return rotateHighlightsLeft(state, action);
    case ROTATE_HIGHLIGHTS_RIGHT:
      return rotateHighlightsRight(state, action);
    case MOVE_HIGHLIGHTS_LEFT:
      return moveHighlightsLeft(state, action);
    case MOVE_HIGHLIGHTS_RIGHT:
      return moveHighlightsRight(state, action);
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
    case UNDO_FIELD:
      return undoField(state, action);
    case RESET_FIELD:
      return resetField(state, action);
    case RESTART:
      return restart(state, action, config);
    default:
      return state;
  }
};