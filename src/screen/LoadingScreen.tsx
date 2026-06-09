import React from "react"
import { View, Text, Image, ActivityIndicator,  } from "react-native"
import { Colors } from "../constants/colors"
import styles from "../styles/LoadingScreen.styles"

export default function LoadingScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Image
          source={{
          uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/home_logo_zktlq8.png"
        }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>AF Home</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={Colors.sky}
        style={styles.loader}
      />
    </View>
  )
}
