import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean
}

const ModalIndicator = (props: Props) => {
  return (
    <Modal
      transparent
      animationType={ "none" }
      visible={ props.visible }
      onRequestClose={ () => null }
    >
      <View style={ styles.background }>
        <View style={ styles.card }>
          <ActivityIndicator animating={ true } color={ 'blue' } size={ 20 }/>
          <Text style={ {
            position: "absolute",
            paddingTop: 50
          } } numberOfLines={ 1 }>
            メディア生成中
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `rgba(0,0,0,${ 0.4 })`
  },
  card: {
    backgroundColor: "white",
    height: 100,
    width: 100,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});

export default ModalIndicator;