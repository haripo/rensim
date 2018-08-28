import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import NextWindowContainer from '../../shared/containers/NextWindowContainer';
import ChainResultContainer from '../../shared/containers/ChainResultContainer';
import { contentsMargin, simulatorWidth } from '../../shared/utils/constants';
import Field from '../../shared/components/Field';
import HandlingPuyos from '../../shared/components/HandlingPuyos';
import SimulatorControls from '../../shared/components/SimulatorControls';
import HistoryTree from '../../shared/components/HistoryTree/HistoryTree';
import { HotKeys } from 'react-hotkeys';
import WebToolbar from './WebToolbar';
import LayoutBaseContainer from '../containers/LayoutBaseContainer';
import { PendingPair, PendingPairPuyo, StackForRendering } from "../../shared/selectors/simulatorSelectors";
import { DroppingPlan, VanishingPlan } from "../../shared/models/chainPlanner";
import { Layout } from "../../shared/selectors/layoutSelectors";
import { Theme } from "../../shared/selectors/themeSelectors";
import { HistoryRecord } from "../../shared/models/history";

export type Props = {
  stack: StackForRendering,
  ghosts: PendingPairPuyo[],
  pendingPair: PendingPair,
  droppings: DroppingPlan[],
  vanishings: VanishingPlan[],

  puyoSkin: string,
  layout: Layout,
  theme: Theme,

  isActive: boolean,
  canUndo: boolean,
  canRedo: boolean,

  onUndoSelected: () => void,
  onRedoSelected: () => void,
  onResetSelected: () => void,
  onRestartSelected: () => void,
  onShareSelected: () => void,
  onRotateLeftPressed: () => void,
  onRotateRightPressed: () => void,
  onMoveLeftPressed: () => void,
  onMoveRightPressed: () => void,
  onDropPressed: () => void,
  onDroppingAnimationFinished: () => void,
  onVanishingAnimationFinished: () => void,

  history: HistoryRecord[],
  historyIndex: number,
  historyTreeLayout: any,
  onHistoryNodePressed: (index: number) => void
}

export default class Simulator extends Component<Props, {}> {
  hotkeyElementRef: any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // enable hotkeys
    if (this.hotkeyElementRef) {
      this.hotkeyElementRef.focus();
    }
  }

  render() {
    const keyMap = {
      'moveLeft': 'left',
      'moveRight': 'right',
      'putHand': 'down',
      'rotateRight': 'x',
      'rotateLeft': 'z',
      'undo': 'a',
      'redo': 's'
    };

    const keyHandlers = {
      'moveLeft': this.props.onMoveLeftPressed,
      'moveRight': this.props.onMoveRightPressed,
      'putHand': this.props.onDropPressed,
      'rotateRight': this.props.onRotateRightPressed,
      'rotateLeft': this.props.onRotateLeftPressed,
      'undo': this.props.onUndoSelected,
      'redo': this.props.onRedoSelected
    };

    return (
      <HotKeys
        keyMap={ keyMap }
        handlers={ keyHandlers }
        style={ { outline: '0' } }
        focused>
        { /* Focused on mounted to enable hotkeys */ }
        <View
          ref={ c => this.hotkeyElementRef = c }
          tabIndex={ -1 }
          // @ts-ignore
          style={ { outline: '0' } }>
          <View>
            <WebToolbar/>
          </View>
          <LayoutBaseContainer>
            <View style={ styles.container }>
              <View style={ styles.contents }>
                <View>
                  <HandlingPuyos
                    pair={ this.props.pendingPair }
                    puyoSkin={ this.props.puyoSkin }
                    layout={ this.props.layout }>
                  </HandlingPuyos>
                  <Field
                    stack={ this.props.stack }
                    ghosts={ this.props.ghosts }
                    droppings={ this.props.droppings }
                    vanishings={ this.props.vanishings }
                    isActive={ this.props.isActive }
                    style={ styles.field }
                    theme={ this.props.theme }
                    layout={ this.props.layout }
                    puyoSkin={ this.props.puyoSkin }
                    onDroppingAnimationFinished={ this.props.onDroppingAnimationFinished }
                    onVanishingAnimationFinished={ this.props.onVanishingAnimationFinished }
                  />
                </View>
                <View style={ styles.side }>
                  <View style={ styles.sideHead }>
                    <NextWindowContainer/>
                    <ChainResultContainer/>
                  </View>
                  <SimulatorControls
                    onUndoSelected={ this.props.onUndoSelected }
                    onRedoSelected={ this.props.onRedoSelected }
                    onRotateLeftPressed={ this.props.onRotateLeftPressed }
                    onRotateRightPressed={ this.props.onRotateRightPressed }
                    onMoveLeftPressed={ this.props.onMoveLeftPressed }
                    onMoveRightPressed={ this.props.onMoveRightPressed }
                    onDropPressed={ this.props.onDropPressed }
                    isActive={ this.props.isActive }
                    canUndo={ this.props.canUndo }
                    canRedo={ this.props.canRedo }
                    shortcuts={ keyMap }
                  />
                </View>
              </View>
              <View style={ styles.historyTree }>
                <HistoryTree
                  historyTreeLayout={ this.props.historyTreeLayout }
                  onNodePressed={ this.props.onHistoryNodePressed }
                />
              </View>
            </View>
          </LayoutBaseContainer>
        </View>
      </HotKeys>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contents: {
    display: 'flex',
    flexDirection: 'row',
    width: simulatorWidth - contentsMargin,
    // @ts-ignore
    outline: '0'
  },
  side: {
    flex: 1,
    justifyContent: 'space-between',
    marginRight: contentsMargin,
    marginLeft: contentsMargin,
    marginBottom: contentsMargin
  },
  sideHead: {
    flex: 1
  },
  historyTree: {},
  hotkeyElement: {
    borderWidth: 0
  }
});