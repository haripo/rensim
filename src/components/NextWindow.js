/**
 * @flow
 */

import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { contentsPadding, puyoSize } from '../utils/constants';
import Puyo from './Puyo';

/**
 * Component for render next and double-next pairs
 */
export default class NextWindow extends Component {
  render() {
    const { next, doubleNext } = this.props;
    return (
      <View style={ styles.component }>
        <View style={ styles.nextWindow }>
          <Puyo
            puyo={ next[0] }
            size={ puyoSize }
            x={ contentsPadding }
            y={ contentsPadding }/>
          <Puyo
            puyo={ next[1] }
            size={ puyoSize }
            x={ contentsPadding }
            y={ contentsPadding + puyoSize }/>
        </View>
        <View style={ styles.nextWindow }>
          <Puyo
            puyo={ doubleNext[0] }
            size={ puyoSize }
            x={ contentsPadding }
            y={ contentsPadding }/>
          <Puyo
            puyo={ doubleNext[1] }
            size={ puyoSize }
            x={ contentsPadding}
            y={ contentsPadding + puyoSize}/>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  component: {
    flexDirection: 'row',
    backgroundColor: '#BBBBBB'
  },
  nextWindow: {
    width: puyoSize + contentsPadding * 2,
    height: puyoSize * 2 + contentsPadding * 2,
    justifyContent: 'center',
    alignItems: 'center'
  }
});