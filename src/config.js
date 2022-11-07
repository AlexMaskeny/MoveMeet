import { API, graphqlOperation } from 'aws-amplify';
import { getLatestMessagesByTime } from './api/calls';


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
    text4: "rgba(137,137,137,0.60)"
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

export const locConversion = (lat, long) => {
    //Takes a long, lat. Returns an object with long, lat, latf1, latf2, long1,long2,long3
    const round = (iNumber) => {
        const number = iNumber / 1000.0;
        const multiplicity = number / Math.abs(number);
        const f1 = 1000.0 * multiplicity * Math.floor(Math.abs(number));
        const f2 = 1000.0 * multiplicity * Math.ceil(Math.abs(number));
        return {
            f1: f1,
            f2: f2,
            mult: multiplicity,
        }
    }
    const nLat = lat * 364011.1; //Converts to feet
    const nLong = long * 365221.0 * Math.cos(lat * Math.PI / 180.0); //Converts to feet
    const latRound = round(nLat);
    const latf1 = "" + latRound.f1;
    const latf2 = "" + latRound.f2;
    const longRound = round(nLong);
    const long1 = "" + longRound.f1 + "#" + longRound.mult * (Math.abs(longRound.f1)+1000);
    const long2 = "" + longRound.mult*(Math.abs(longRound.f1) - 1000) + "#" + longRound.f1;
    const long3 = "" + longRound.f2 + "#" + longRound.mult *(Math.abs(longRound.f2) + 1000) + "";
    return {
        lat: ""+nLat,
        long: ""+nLong,
        latf1: latf1,
        latf2: latf2,
        long1: long1,
        long2: long2,
        long3: long3,
    };

 
}

export const distance = (lat1, long1, lat2, long2) => {
    const dis = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(long1 - long2, 2));
    const miles = dis * 0.0001893939;
    const rounded = ("" + miles).substring(0, 3);
    if (miles < 0.1) {
        return Math.ceil(dis)+ " Feet";
    }
    return rounded + " Miles";
}


export const timeLogic = (diffSeconds) => {
    if (diffSeconds <= 5) {
        return "now"
    } else if (diffSeconds < 60) {
        return "" + Math.floor(diffSeconds) + "s"
    } else if (diffSeconds < (60 * 60)) {
        return "" + Math.floor(diffSeconds / 60) + "m";
    } else if (diffSeconds < (60 * 60 * 24)) {
        return "" + Math.floor(diffSeconds / (60 * 60)) + "h";
    } else if (diffSeconds < (60 * 60 * 24 * 7)) {
        return "" + Math.floor(diffSeconds / (60 * 60 * 24)) + "d";
    } else {
        return "" + Math.floor(diffSeconds / (60 * 60 * 24 * 7)) + "w";
    }
}