const os = require("os");
const path = require("path");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const { parseCameraText } = require("./parse");
const utils = require("./utils");
const { readdir } = require("./utils");

const { createWorker, createScheduler } = Tesseract;

const scheduler = createScheduler();

const addNewWorker = async () => {
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    worker.setParameters({
        tessedit_char_whitelist: "NSWE0123456789DOWLSKMH.:°”’/ "
    });
    scheduler.addWorker(worker);
};


const outputFile = path.join(__dirname, "output.json");
const progressFile = path.join(__dirname, "progress.json");
const sourceVideoDir = process.env.VIDEO_DIR || "/Users/albertoluna/tmp/camara";
const framesDir = path.join(__dirname, "frames");

let output;
try {
    output = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
} catch(err) {
    fs.writeFileSync(outputFile, "[]");
    output = [];
}
let progress;
try {
    progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
} catch(err) {
    fs.writeFileSync(progressFile, "{}");
    progress = {};
}

const parseFrames = async (videoFileName) => {
    const files = await readdir(framesDir);
    const videoProgress = progress[videoFileName] || {};
    if (videoProgress.finished === true) {
        return;
    }
    const jobPromises = [];
    const nonHiddenFiles = [];
    for (let file of files) {
        if (file.startsWith(".")) {
            continue;
        }
        if (videoProgress[file] === true) {
            continue;
        }
        const filePath = path.join(__dirname, "frames", file);
        // convert frame_0001.png -fuzz 40% -fill black +opaque "#FFFB53" test.png
        await utils.exec("convert", [filePath, "-fuzz", "40%", "-fill", "black", "+opaque", "#FFFB53", filePath]);
        console.log("Add job text", filePath);
        jobPromises.push(scheduler.addJob("recognize", filePath));
        nonHiddenFiles.push([file, filePath]);
    }

    const results = await Promise.all(jobPromises);

    for (let i = 0; i < results.length; i++) {
        const { data: { text } } = results[i];
        const [file, filePath] = nonHiddenFiles[i];
        try {
            const frame = parseCameraText(text);
            console.log("Parsed text", filePath, text, frame);
            output.push({ ...frame, videoFileName });
            await utils.writeFile(outputFile, JSON.stringify(output, null, 4));
            videoProgress[file] = true;
            progress[videoFileName] = videoProgress;
            await utils.writeFile(progressFile, JSON.stringify(progress, null, 4));

        } catch(err) {
            console.error("Error parsing text", text);
            console.error(err);
            videoProgress[file] = err.message + " -- " + text;
            progress[videoFileName] = videoProgress;
            await utils.writeFile(progressFile, JSON.stringify(progress, null, 4));
        }
    }

    for (let file of files) {
        if (file.startsWith(".")) {
            continue;
        }
        await utils.unlink(path.join(framesDir, file));
    }
    videoProgress.frames = false;
    videoProgress.finished = true;
    progress[videoFileName] = videoProgress;
    await utils.writeFile(progressFile, JSON.stringify(progress, null, 4));
};

(async () => {
    for (let i = 0; i < os.cpus().length / 2; i++) {
        await addNewWorker();
    }
    const files = await readdir(sourceVideoDir);
    for (let file of files) {
        if (file.startsWith(".")) {
            continue;
        }
        const videoProgress = progress[file] || {};
        if (videoProgress.finished === true) {
            continue;
        }
        const filePath = path.join(sourceVideoDir, file);
        const stat = await utils.stat(filePath);
        if (stat.isDirectory()) {
            continue;
        }
        if (videoProgress.frames !== true) {
            // ffmpeg -i video/2020_0731_184119_552.MOV -r 0.25 -filter:v "crop=1905:40:15:1020" frames/frame_%04d.png
            console.log("Generating frames for", file);
            await utils.exec("ffmpeg", ["-i", filePath, "-r", 0.25, "-filter:v", "crop=1905:40:15:1020", path.join(framesDir, "frame_%04d.png")]);
            videoProgress.frames = true;
            progress[file] = videoProgress;
            await utils.writeFile(progressFile, JSON.stringify(progress, null, 4));
        }
        await parseFrames(file);
    }
    await scheduler.terminate();
})().catch((err) => {
    console.error(err);
    return scheduler.terminate();
});
