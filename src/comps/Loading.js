import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors} from '../config';

function Loading({enabled}) {
    if (enabled) {
        return (
            <View style={{marginVertical: 10}}>
                <ActivityIndicator size='large' color={colors.pBeam} />
            </View>
        )
    } else {
        return (<></>)
    };
}

export default Loading;