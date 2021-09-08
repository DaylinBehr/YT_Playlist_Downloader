// DEPENDENCIES
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const fs = require("fs");
const path = require("path");

// GET ARGUMENTS FROM CONSOLE. IGNORE FIRST 2
let myArgs = process.argv.slice(2);

// Output Arguments
// process.stdout.write("myArgs: ", myArgs[0]);

// DEFINE DOWNLOADS DIRECTORY
let downloadsDir = "./downloads";

// CHECK IF DOWNLOAD DIRECTORY EXISTS OTHERWISE CREATE IT
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}
// RUN MAIN DOWNLOAD METHOD
execute();

// REGEX FUNCTION TO CHECK IF YOUTUBE LINK IS VALID
function validURL(str) {
  // URL REGEX PATTERN
  let urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i" // make it case insensitive
  );
  return !!urlPattern.test(str);
}

// MAIN YOUTUBE AUDIO DOWNLOAD LOGIC
async function execute() {
  try {
    // CHECK IF LINK IS VALID URL
    if (validURL(myArgs[0])) {
      // CHECK IF LINK IS NOT VALID PLAYLIST
      if (!ytpl.validateID(myArgs[0])) {
        // CHECK IF LINK IS VALID YOUTUBE VIDEO LINK
        if (ytdl.validateURL()) {
          // GET VIDEO INFO
          let info = await ytdl.getInfo(myArgs[0]);

          // REGEX FOR SONG NAMES
          let pattern = /\s[-_|?{}]/gi;

          // CLEANED UP SONG NAME
          let newName = info.videoDetails.title.replace(pattern, "") + ".mp3"; // RENAME WITHOUT SPACES

          // OUTPUT NEW SONG NAME
          process.stdout.write(newName);

          // DOWNLOAD SONG AND SAVE TO FILE
          const downloadStrm = ytdl(myArgs[0], {
            filter: "audioonly",
            format: "mp3",
          });

          // PIPE DOWNLOADED SONG TO NEW MP3 FILE AND SAVE LOCALLY
          downloadStrm.pipe(fs.createWriteStream(downloadsDir + "/" + newName));

          // STREAM DOWNLOAD FINISHED EVENT
          downloadStrm.on("end", () => {
            process.stdout.write(
              `\nDone Downloading ${info.videoDetails.title}!\nYour song can be found at ${downloadsDir} / ${newName}\n`
            );
          });

          // STREAM DOWNLOAD ERROR EVENT
          downloadStrm.on("error", (err) => {
            process.stderr.write(
              `\nAn error occurred while downloading: ${info.videoDetails.title}! Check your network or refer to the below error!\n`
            );
            process.stderr.write(`\nError: ${err.message}\n`);
          });
        } else {
          // INVALID YOUTUBE LINK EXCEPTION HANDLING
          console.log("INVALID YOUTUBE LINK");
        }
      } // CHECK IF LINK IS VALID PLAYLIST
      else if (ytpl.validateID(myArgs[0])) {
        // FETCH ALL SONGS FROM PLAYLIST
        let songList = await ytpl(myArgs[0], { pages: Infinity });

        // REGEX FOR SONG NAMES
        let pattern = /\s[-_|?{}]/gi;

        // CLEANED UP PLAYLIST FOLDER NAME
        let playlistFolder =
          downloadsDir + "/" + songList.title.replace(pattern, "");

        // ENSURE PLAYLIST DIRECTORY EXISTS OTHERWISE CREATE FOLDER WITH PLAYLIST NAME
        if (!fs.existsSync(playlistFolder)) {
          fs.mkdirSync(playlistFolder);
        }
        process.stdout.write(
          `\n\nDOWNLOADING PLAYLIST: ${songList.title.toUpperCase()}\n\n`
        );
        process.stdout.write(
          `FOUND ${songList.items.length.toString()} SONGS!\n\n`
        );
        // LOOP THROUGH EACH PLAYLIST ITEM
        songList.items.forEach((item) => {
          // CLEANED UP SONG NAME
          let newName = item.title.replace(pattern, "") + ".mp3";

          // DOWNLOAD SONGS AND SAVE TO THEIR OWN FILES
          const downloadStrm = ytdl(item.url, {
            filter: "audioonly",
            format: "mp3",
          });

          // PIPE DOWNLOADED SONG TO NEW MP3 FILE AND SAVE LOCALLY
          downloadStrm.pipe(
            fs.createWriteStream(playlistFolder + "/" + newName)
          );

          // STREAM DOWNLOAD FINISHED EVENT
          downloadStrm.on("end", () => {
            let songPath = path.dirname(playlistFolder + "/" + newName);
            process.stdout.write(
              `\nDone Downloading ${item.title}!\nYour songs can be found at ${songPath}\n\n`
            );
          });

          // STREAM DOWNLOAD ERROR EVENT
          downloadStrm.on("error", (err) => {
            process.stderr.write(
              `\nAn error occurred while downloading: ${item.title}! Check your network or refer to the below error!\n`
            );
            process.stderr.write(`\nError: ${err.message}\n\n`);
          });
        });
      }
    } else {
      // INVALID LINK EXCEPTION HANDLING
      process.stderr.write("\nINVALID LINK\n\n");
    }
  } catch (err) {
    // CATCH ARBITRARY ERRORS AND DISPLAY
    process.stderr.write("\nSOMETHING WENT WRONG!\n");
    process.stderr.write(`\n${err}\n\n`);
  }
}