/* ---------- Requires ---------- */
var request = require('request').defaults({ encoding: null });
var https = require('https');

/**
 * This class wraps all of the methodology for the API calls that the bot will make for various commands (ie: thisStrain API)
 */
class Client {

    constructor(url) {
        this.apiURL = url;
    }

    /* Tests the availability of the API */
    testAPIConnection(callback) {
        var options = {
            url: this.apiURL,
            method: 'get'
        };
        request(options, (error, response, body) => {
            if (error) {
                return callback(null, error);
            }
            else {
                var response = JSON.parse(body);
                return callback(response, false);
            }
        });
    }

    /* Makes a special call (ie: /predictOnImage) */
    makeSpecialCall(appended, encoded, callback) {
        var form = { data: encoded };
        request.post({
            url: this.apiURL + appended,
            form: form,
            method: 'POST'
        }, (error, response, body) => {
            if (!error) {
                var result = JSON.parse(body);
                callback(result);
            }
        });
    }

    /* Gets the base64 encoded string of an Image found at url */
    getImageBase64FromURL(url, callback) {
        https.get(url, (resp) => {
            resp.setEncoding('base64');
            var body = "";
            resp.on('data', (data) => { body += data});
            resp.on('end', () => {
                callback(body, false);
            });
        }).on('error', (e) => {
            console.log(`Got error: ${e.message}`);
            callback(null, e.message);
        });
    }

}

module.exports = Client;