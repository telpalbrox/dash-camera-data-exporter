const test = require("ava");
const { parseCoordinate, parseCameraText, parseSpeed } = require("./parse");

test("It should parse coordinates", (t) => {
    t.is(parseCoordinate("N48°30°32.44"), 48.509011);
    t.is(parseCoordinate("N48° 30\" 32. 44”"), 48.509011);
    t.is(parseCoordinate("E34°59’ 9.63"), 34.986008);
    t.is(parseCoordinate("E34°59’ 9. 63"), 34.986008);
    t.is(parseCoordinate("N48°30739. 18"), 48.510883);
    t.is(parseCoordinate("E35°0’-15. 617"), 35.004336);
    t.is(parseCoordinate("E34°59 47. 88"), 34.996633);
});

const assertCameraText = (t, text, expected) => {
    t.deepEqual(parseCameraText(text), expected);
};

test("It should parse text coming from the camera", (t) => {
    assertCameraText(t, "2020/07/31 18:41:14 DOD LS475W OKM/H N48°30°32.44” E34°59’ 9.63” 1S0:00050", {
            coordinates: {
                latitude: 48.509011,
                longitude: 34.986008,
                speed: 0
            },
            date: "2020-07-31T18:41:14.000+02:00"
        }
    );
    assertCameraText(t, "2020/07/31 18:41:12 DOD LS475W OKM/H N48°30°32.44” E34°59° 9. 63” IS0:00050", {
            coordinates: {
                latitude: 48.509011,
                longitude: 34.986008,
                speed: 0
            },
            date: "2020-07-31T18:41:12.000+02:00"
        }
    );
});

test("It should parse speeds correctly", (t) => {
    t.is(parseSpeed("OKM/H"), 0);
    t.is(parseSpeed("11KM/H"), 11);
});
