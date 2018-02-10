import { connect } from 'react-redux';
import {
  initializeSimulator,
} from '../../shared/actions/actions';
import History from '../components/History';
import { getGhost, getPendingPair, getStack, isActive } from '../../shared/selectors/simulatorSelectors';
import toJS from '../../shared/utils/toJS';

const mapStateToProps = (state) => {
  const simulator = state.get('simulator');

  return {
    stack: getStack(simulator),
    current: simulator.getIn(['queue', 0]),
    ghosts: getGhost(simulator),
    pendingPair: getPendingPair(simulator),
    isActive: isActive(state),
    moves: simulator.get('moves')
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onSimulatorLaunched: () => {
      dispatch(initializeSimulator());
    },
    onPrevPressed: () => {

    },
    onNextPressed: () => {

    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(toJS(History));
