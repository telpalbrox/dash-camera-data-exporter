# Dash Camera Data Exporter (DOD LS475W)

Utiliy to extract info form dash camera frames.

## Dependencies
- Nodejs LTS
- [FFmpeg](https://ffmpeg.org) has to be available in your PATH
- ImageMagick. `convert` command has to be available in your PATH


## Usage
- clone repo
- `npm i`
- `VIDEO_DIR=/folder/with/camera/videos npm start`
- Now you have all the raw data in `output.json`
- You can generate coordiates for [this tool](https://mobisoftinfotech.com/tools/plot-multiple-points-on-map/) `npm run export`
