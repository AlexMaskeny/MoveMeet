import React from 'react';
import { ImageBackground } from 'react-native';


function ImageBackgroundLoader({
    source,
    children,
    ...otherProps
}) {
    //const [loading, setLoading] = React.useState(true);
    return (
        <ImageBackground
            source={{ uri: source.uri}}
            {...otherProps}
        >{children}</ImageBackground>
    );
}

export default ImageBackgroundLoader;