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
    async youtubeSearch(query) {
        var resultsDictionary = {};
        const response = await this.youtube.search.list({
            part: 'id,snippet',
            q: query,
            maxResults: 5,
            type: 'video'
        });
        var index = 0;
        for(var i in response.data.items) {
            const item = response.data.items[i];
            var thumbnail = undefined;
            for(var key in item.snippet.thumbnails) { // Get only first thumbnail of the video
                thumbnail = item.snippet.thumbnails[key].url;
                break;
            }
            resultsDictionary[index] = {
                'title': item.snippet.title,
                'id': item.id.videoId,
                'thumbnail': thumbnail
            }
            index += 1;
        }
        const embedded = new Embedded(resultsDictionary);
        return embedded.container;
    }

 }

 module.exports = Player;