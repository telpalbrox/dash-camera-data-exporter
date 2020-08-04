const { DateTime } = require("luxon");

/**
 * @typedef {Object} LatLong
 * @property {number} latitude
 * @property {number} longitude
 */

 /**
 * @typedef {Object} DCDEPosition
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} speed
 */

function convertDMSToDD(degrees, minutes, seconds, direction) {   
    var dd = Number(degrees) + Number(minutes)/60 + Number(seconds)/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return Number.parseFloat(dd.toFixed(6));
}

const coordinateSeparator = /[°|’|"|”|\s]/gi
 /**
  * @param {string} rawCoordinate
  */
const parseCoordinate = (rawCoordinate) => {
    rawCoordinate = rawCoordinate.replace(/:/gi, ".").replace(/-/gi, "");
    const direction = rawCoordinate[0];

    const coordinateParts = rawCoordinate
        .substr(1)
        .split(coordinateSeparator)
        .filter((part) => part !== "");

    for (let i = 0; i < coordinateParts.length; i++) {
        const part = coordinateParts[i];
        if (part.length > 5 && part[2] === "7") {
            coordinateParts.splice(i, 1, part[0] + part[1]);
            coordinateParts.splice(i + 1, 0, part.substr(3));
        }
    }

    for (let i = 0; i < coordinateParts.length; i++) {
        const part = coordinateParts[i];
        if (part.endsWith(".")) {
            coordinateParts.splice(i, 1, part + coordinateParts[i + 1]);
            coordinateParts.splice(i + 1, 1);
        }
    }

    for (let i = 0; i < coordinateParts.length; i++) {
        const part = coordinateParts[i];
        if (part.includes(".") && part.length > 5) {
            const index = coordinateParts.findIndex((tmp) => tmp === part);
            coordinateParts.splice(index, 1, part.substr(0, part.length - 1));
        }
    }

    const [ degrees, minutes, seconds ] = coordinateParts;

    const decimalCoordinate = convertDMSToDD(degrees, minutes, seconds, direction);
    if (decimalCoordinate > 90 || decimalCoordinate < -90) {
        throw new Error("INVALID_LAT_LONG: latitude or longitude cannot be bigger or smaller than 90");
    }
    return decimalCoordinate;
}

const latLongRegex = /[N|E|S|W](\s*\d+\s*[°|"|’|”|7|\s]\s*-*){2}\s*(\d+.?\d*\s*\d+)/gi;
 /**
 * @param {string} text
 * @returns {LatLong}
 */
const parseLatitudeLongitude = (text) => {
    text = text.replace(/NA/, "N4").replace("N4A", "N4");
    const regexResult = text.match(latLongRegex);
    if (regexResult == null) {
        throw new Error("INVALID_LAT_LONG: no latitude and longitude found");
    }
    if (regexResult.length !== 2) {
        throw new Error("INVALID_LAT_LONG: latitude or longitude not found");
    }
    const latitude = parseCoordinate(regexResult[0]);
    const longitude = parseCoordinate(regexResult[1]);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new Error("INVALID_LAT_LONG: error parsing latitude or longitude");
    }
    return {
        latitude,
        longitude
    };
};

/**
 * @param {string} text
 * @returns {DCDEPosition}
 */
const parseCoordinates = (text) => {
    const speed = parseSpeed(text);
    const latLong = parseLatitudeLongitude(text);
    return {
        speed,
        ...latLong
    };
};

const speedRegex = /[o|O|\d+]+KM\/H/gi;
const oReplace = /[o|O]+/gi;
/**
 * @param {string} text
 * @returns {number}
 */
const parseSpeed = (text) => {
    const regexResult = text.match(speedRegex);
    if (regexResult == null || !regexResult[0]) {
        throw new Error("INVALID_SPEED: Speed not found");
    }
    let regexMatch = regexResult[0];
    regexMatch = regexMatch.replace(oReplace, "0");
    const speed = Number.parseFloat(regexMatch);
    if (Number.isNaN(speed)) {
        throw new Error("INVALID_SPEED: Speed not valid");
    }
    return speed;
};

/**
 * @param {string} text 
 * @returns {string}
 */
const parseDate = (text) => {
    const parts = text.split(" ");
    const rawDateTime = parts[0].replace(/\./g, "") + " " + parts[1].replace(/\./g, "");
    const dateTime = DateTime.fromFormat(rawDateTime, "yyyy/MM/dd TT");
    return dateTime.toISO();
};

/**
 * @param {string} text 
 */
const parseCameraText = (text) => {
    const date = parseDate(text);
    const coordinates = parseCoordinates(text);
    return {
        date,
        coordinates
    }
};

module.exports = {
    parseCameraText,
    parseCoordinate,
    parseCoordinates,
    parseDate,
    parseLatitudeLongitude,
    parseSpeed
};
