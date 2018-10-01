import React, { Component } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { parse } from 'query-string';
import Modal from 'react-modal';
import { ShareUrls } from "../../shared/selectors/simulatorSelectors";
import { themeColor, themeLightColor } from "../../shared/utils/constants";

// @ts-ignore
import t from '../../shared/utils/i18n';

export type Props = {
  shareURLs: ShareUrls
}

type State = {}

export default class ShareModal extends Component<Props, State> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View>
        <Text style={ styles.title }>{ t('share') }</Text>
        <View>
          <Text>{ t('shareWholeHistory') }</Text>
          <TextInput style={ styles.urlInput } value={ this.props.shareURLs.whole } />
        </View>
        <View>
          <Text>{ t('shareCurrentHistory') }</Text>
          <TextInput style={ styles.urlInput } value={ this.props.shareURLs.current } />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    paddingBottom: 10,
  },
  urlInput: {
    width: 600,
    padding: 6,
    margin: 6,
    paddingBottom: 10,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: themeLightColor
  }
});