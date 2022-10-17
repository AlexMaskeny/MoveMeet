import React from 'react';
import { View, Image } from 'react-native'

import { debug } from '../config';


function ImageLoader({
    source,
    ...otherProps
}) {
    //const [loading, setLoading] = React.useState(true);
    return (
        <Image 
            source={{ uri: source.uri }}
            {...otherProps}
        />      
    );
    
}

export default ImageLoader;