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

export const toChat = (lat, long) => {
    const nLat = lat * 364011.1; //Converts to feet
    const nLong = long * 365221.0 * Math.cos(lat * Math.PI / 180.0); //Converts to feet
    const latRound = round(nLat);
    const latf1 = "" + latRound.f1;
    const latf2 = "" + latRound.f2;
    const longRound = round(nLong);
    const long1 = "" + longRound.f1 + "#" + longRound.mult * (Math.abs(longRound.f1) + 1000);
    const long2 = "" + longRound.mult * (Math.abs(longRound.f1) - 1000) + "#" + longRound.f1;
    const long3 = "" + longRound.f2 + "#" + longRound.mult * (Math.abs(longRound.f2) + 1000) + "";
    return {
        lat: "" + nLat,
        long: "" + nLong,
        latf1: latf1,
        latf2: latf2,
        long1: long1,
        long2: long2,
        long3: long3,
    };
}

export const toUser = (lat, long) => {
    const nLat = lat * 364011.1; //Converts to feet
    const nLong = long * 365221.0 * Math.cos(lat * Math.PI / 180.0); //Converts to feet
    const latRound = round(nLat);
    const latf1 = "" + latRound.f1;
    const latf2 = "" + latRound.f2;
    const longRound = round(nLong);
    const longf1 = "" + longRound.f1;
    const longf2 = "" + longRound.f2;
    return {
        lat: "" + nLat,
        long: "" + nLong,
        latf1: latf1,
        latf2: latf2,
        longf1: longf1,
        longf2: longf2
    };
}
