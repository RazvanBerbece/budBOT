var search = require('youtube-search');
const Embedded = require('./Embeds/embed.js');

/**
 * Class containing YouTube Player methodology, implemented through the googleapis package
 */

 class Player {

    /* Constructor holding AUTH & Version params */
    constructor(token) {
        this.searchOptions = {
            maxResults: 5,
            key: token,
            type: 'video,playlist'
        }
    }

    /* YouTube Search query using a given string, called inside function below and returns an embedded container of results */
    youtubeSearch(query, callback) {    
        search(query, this.searchOptions, function(err, results) {
            if (err) {
                return callback(err, null);
            }
            var index = 0;
            var resultsDictionary = {};
            for(var i in results) {
                const item = results[i];
                resultsDictionary[index] = {
                    'title': item.title ? item.title : 'Title not available.',
                    'id': item.id,
                    'desc': item.description ? item.description : 'Description not available.',
                    'thumbnail': item.thumbnails.default.url,
                    'playlistID': undefined
                }
                index += 1;
            }
            const embedded = new Embedded(resultsDictionary);
            return callback(false, embedded);
        });
    }

 }

 module.exports = Player;