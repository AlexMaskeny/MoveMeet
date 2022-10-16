import React from 'react';
import { View, Image } from 'react-native'
import CachedImage from 'expo-cached-image';


function ImageLoader({
    loadImage,
    source,
    ...otherProps
}) {
    const [loading, setLoading] = React.useState(true);
    return (
        <Image
            source={loading ? loadImage : source}
            onLoadEnd={() => {
                setLoading(false);
            }}
            onLoadStart={() => {
                setLoading(true);
            }}
            {...otherProps}
        />
    );
    
}

export default ImageLoader;