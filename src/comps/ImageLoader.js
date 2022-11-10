import React from 'react';
import { View, Image } from 'react-native'
import CachedImage from 'react-native-expo-cached-image';

import { debug } from '../config';


function ImageLoader({
    source,
    ...otherProps
}) {
    const [loading, setLoading] = React.useState(true);
    return (
        <>
        <CachedImage
            onLoadEnd={()=>setLoading(false)}
            source={{ uri: loading ? source.loadImage : source.uri }}
            key={source.key }
            {...otherProps}
            />  
        </>
    );
    
}

export default ImageLoader;