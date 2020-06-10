const {google} = require('googleapis');
const Embedded = require('./Embeds/embed.js');

/**
 * Class containing YouTube Player methodology, implemented through the googleapis package
 */

 class Player {

    /* Constructor holding AUTH & Version params */
    constructor(token) {
        this.youtube = google.youtube({ // Init Youtube API V3 as well
            version: 'v3',
            auth: token
        });
    }

    /* YouTube Search query using a given string, called inside function below and returns an embedded container of results */
    youtubeSearch(query, callback) {
        var resultsDictionary = {};
        this.youtube.search.list({
            part: 'id,snippet',
            q: query,
            maxResults: 5,
            type: 'video'
        }, function (err, response) {
            if (err) {
                console.log(`err = ${err}`);
                return;
            }
            var index = 0;
            for(var i in response.data.items) {
                const item = response.data.items[i];
                var thumbnail = undefined;
                const playlistId = item.id.playlistId;
                for(var key in item.snippet.thumbnails) { // Get only first thumbnail of the video
                    thumbnail = item.snippet.thumbnails[key].url;
                    break;
                }
                resultsDictionary[index] = {
                    'title': item.snippet.title,
                    'id': item.id.videoId,
                    'desc': item.snippet.description,
                    'thumbnail': thumbnail,
                    'playlistID': playlistId
                }
                index += 1;
            }
            const embedded = new Embedded(resultsDictionary);
            return callback(embedded, false); // (data, err) 
        });
    }

 }

 module.exports = Player;