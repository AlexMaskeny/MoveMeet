import React from 'react';
import { Text } from 'react-native';

import { colors, css } from '../config';

//DESCRIPTION: A title comp with the text color of the
//             pBeam set in config file. Also has shadow.
//UTILIZED:    Utilized in text inputs as the "text" prop to 
//             the far right in the container.

function BeamTitle({
    color = colors.pBeam,
    shadowColor = colors.pBeamShadow,
    size = 22,
    style,
    children,
    ...otherProps
}) {
    return (
        <Text
            style={[{
                color: color,
                fontSize: size,
                fontWeight: "bold",
                ...css.beamShadow,
                shadowColor: shadowColor,
            }, style]}
            {...otherProps}
        >
            {children}
        </Text>
    );
}

export default BeamTitle;