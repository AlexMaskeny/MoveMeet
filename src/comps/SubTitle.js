import React from 'react';
import { Text } from 'react-native';

import { dark_colors, css } from '../config';

//DESCRIPTION: A title comp with the text color of the
//             text1 set in config file.
//UTILIZED:    Utilized accross the app as generalized
//             text for most componants

function SubTitle({
    color = dark_colors.text1,
    size = 12,
    style,
    children,
    ...otherProps
}) {
    return (
        <Text
            style={[{
                color: color,
                fontSize: size,
                fontWeight: "300",
            }, style]}
            {...otherProps}
        >
            {children}
        </Text>
    );
}

export default SubTitle;