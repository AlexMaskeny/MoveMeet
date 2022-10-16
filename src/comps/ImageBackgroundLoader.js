import React from 'react';
import { ImageBackground } from 'react-native';


function ImageBackgroundLoader({
    loadImage,
    source,
    children,
    ...otherProps
}) {
    const [loading, setLoading] = React.useState(true);
    const [loadingImage, setLoadingImage] = React.useState(true);
    return (
        <ImageBackground
            source={loading ? loadImage : source}
            onLoadEnd={() => {
                if (loadingImage) {
                    setLoadingImage(false);
                }
                setLoading(false)
            }}
            onLoadStart={() => {
                setLoading(true);
            }}
            {...otherProps}
        >{children}</ImageBackground>
    );
}

export default ImageBackgroundLoader;