//[FUNC] "example" = function explanation
//[FUNC ASYNC] "example" = async function explanation
//[HOOK] "example, [*optional* updateOn]" = hook explanation
//[DATA] "example" = large data variable explanation
//[IF], [ELSE], [ELSE IF], [THEN], [AND], [OR], [SO] used to simply if and else statements
//[REGION_DESC] and [REGION_DEF] used when the region description is too large for one line
//[DESC] a description of a non collapsing section
//[COMPONENT] "example" = component explanation
//[CALL COMP] "example, [updateOn]" = component using the useCallback hook explanation
//Everything else has no prefix

//region [DATA] "const colors" = the app's colors
export const colors = {
    background: "#121212", //A dark grey rgba(18, 18, 18,1)
    container: "#1E1E1E", //A dark grey, but less dark than background
    dark: "#0D0D0D",
    transContainer: "rgba(14,14,14,",
    pBeamBright: "#8CE0FF",
    pBeam: "#8CE0FF", //"rgba(245,182,195,0.72)", Blue Beam
    pBeamDisabled: "#8CE0FF", //"rgba(245,182,195,0.3)", Dull Blue Beam
    pBeamShadow: "#11BEFF", //#F96381", Blue Beam without transparency, slightly whiter
    passiveImg: "rgba(142, 142, 142, 0.9)",
    text1: "#b5b5b5", //Lighest Grey Text
    text2: "#A6A6A6", //Second Lighest Grey Text
    text3: "#b5b5b5", //Third Lighest Grey Text
    text4: "rgba(137,137,137,0.80)",
    text5: "rgba(255,255,255,0.80)",
    text6: "rgba(255,255,255,0.90)",
    error: "#FF4D4D",
    errorTransparent: "rgba(255,77,77,0.05)",
    overlayBackground: "rgba(0,0,0,0.5)"
}
//endregion
//region [DATA] "const css" = the app's global styles
export const css = {
    beamShadow: {
        shadowColor: colors.pBeamShadow,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 3,
        shadowOpacity: 1,
    }
}
//endregion
//region [DATA] "const strings" = the app's global constants
export const strings = {
    APPNAME: "MoveMeet"
}
//endregion
//region [DATA] "const storage" = the app's global async storage based constants
export const storage = {
    UNCONFIRMED: "unconfirmed",
    UNCONFIRMEDUSER: "unconfirmeduser"
};
//endregion
//region [DATA] "const rules" = constants that define rules of the app
export const rules = {
    nearYouRadius: 500, // in feet
    chatDeletionTime: 48, // in hours
    locationAccuracy: 6, //1-6
    locationDismissalRate: 1, //x dismalls per 1 success
    locationUpdateFrequency: 1000, // in ms
    locationDistanceInterval: 0,
    subSafeInitializationDelay: 2000, //in ms
    subSafeUpdateTimeout: 1000, // in ms
    maxNumChats: 10,
    pagination: {
        DiscoverPage: 14 //Max number of users per load
    }
};
//endregion
export const debug = false; //changes whether error messages print
export const enhancedDebug = false;
export const footerHeight = 80;
export const version = "1.0.1";
