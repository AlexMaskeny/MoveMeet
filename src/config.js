export const colors = {
    background: "#121212", //A dark grey rgba(18, 18, 18,1)
    container: "#1E1E1E", //A dark grey, but less dark than background
    pBeamBright: "rgba(25,178,255,1)",
    pBeam: "rgba(25,178,255,0.72)", //"rgba(245,182,195,0.72)", Blue Beam
    pBeamDisabled: "rgba(25,178,255,0.3)", //"rgba(245,182,195,0.3)", Dull Blue Beam
    pBeamShadow: "#19B2FF", //#F96381", Blue Beam without transparency, slightly whiter
    passiveImg: "rgba(142, 142, 142, 0.9)",
    text1: "#C4C4C4", //Lighest Grey Text
    text2: "#A6A6A6", //Second Lighest Grey Text
    text3: "#898989", //Third Lighest Grey Text
}

export const css = {
    beamShadow: {
        shadowColor: colors.pBeamShadow,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 3,
        shadowOpacity: 1,
    }
}

export const debug = true; //changes whether or not error messages print
export const footerHeight = 80;