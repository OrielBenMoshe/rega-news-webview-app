import { Dimensions, StyleSheet } from 'react-native';
const { height, width } = Dimensions.get('window');


const Styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#031048",
    },
    bg: {
        width,
        height,
        backgroundColor: "#031048",
        margin: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    gif: {
        width,
        height,
        margin: "auto",
        resizeMode: 'contain'
    },
});

export default Styles;