//region 3rd Party Imports
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native'
//endregion
//region 1st Party Imports
import BeamTitle from "../comps/BeamTitle";
import Screen from '../comps/Screen';
import * as logger from '../functions/logger';
//endregion

export default function ExplorePage({}) {
    return (
        <Screen theme="white">
            <BeamTitle>Alex</BeamTitle>
        </Screen>
    );
}

const styles = StyleSheet.create({
    //region page
    page: {

    },
    //endregion
});