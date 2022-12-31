import { debug, enhancedDebug } from '../config';

export const log = (data) => {
    if (debug) console.log(data);
}

export const warn = (data) => {
    if (debug) console.warn(data);
}

export const error = (data) => {
    if (debug) console.error(data);
}

export const eLog = (data) => {
    if (enhancedDebug) console.log(data);
}

export const eWarn = (data) => {
    if (enhancedDebug) console.warn(data);
}

export const eError = (data) => {
    if (enhancedDebug) console.error(data);
}