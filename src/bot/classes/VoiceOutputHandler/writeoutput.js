const fs = require('fs');
const { file } = require('googleapis/build/src/apis/file');

function generateOutputFile(user, stream) {
    const source = __dirname + `/audiodata/` + `${user.id}-${Date.now()}.pcm`;
    var destination = fs.createWriteStream(source);
    stream.pipe(destination);
    console.log('Audio data saved');
}

module.exports = generateOutputFile;
