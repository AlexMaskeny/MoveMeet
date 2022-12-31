const timeLogic = (diffSeconds,suffix) => {
    if (diffSeconds <= 5) {
        return "Now"
    } else if (diffSeconds < 60) {
        return "" + Math.floor(diffSeconds) + "s" + suffix;
    } else if (diffSeconds < (60 * 60)) {
        return "" + Math.floor(diffSeconds / 60) + "m" + suffix;
    } else if (diffSeconds < (60 * 60 * 24)) {
        return "" + Math.floor(diffSeconds / (60 * 60)) + "h" + suffix;
    } else if (diffSeconds < (60 * 60 * 24 * 7)) {
        return "" + Math.floor(diffSeconds / (60 * 60 * 24)) + "d" + suffix;
    } else {
        return "" + Math.floor(diffSeconds / (60 * 60 * 24 * 7)) + "w" + suffix;
    }
}

export const noAgo = (diffSeconds) => {
    return timeLogic(diffSeconds, "");
}

export const ago = (diffSeconds) => {
    return timeLogic(diffSeconds, " ago");
}