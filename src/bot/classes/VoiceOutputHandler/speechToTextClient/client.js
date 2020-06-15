const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

/**
 * Client which uses the GCloud Speech-To-Text API and returns the result
 */
class SpeechToTextClient {

    constructor(file) {
        this.client = new speech.v1p1beta1.SpeechClient({
            keyFilename: __dirname + '/thisStrain-f7b9e93c73cd.json'
        });
        this.file = file;
    }

    readLocalFile() {
        const audioFile = fs.readFileSync(this.file);
        const audioBytes = audioFile.toString('base64');
        const audio = {
            content: audioBytes
        }
        return audio;
    }

    getTextTranscript(callback) {
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            audioChannelCount: 2
        };
          const request = {
            audio: this.readLocalFile(),
            config: config,
        };
        this.client.recognize(request)
        .then(responses => {
            const response = responses[0].results[0].alternatives[0].transcript;
            callback(null, response);
        })
        .catch(err => {
            callback(err, null);
        });
    }

}

module.exports = SpeechToTextClient;