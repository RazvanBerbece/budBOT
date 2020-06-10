/* ---------- Requires ---------- */
const Discord = require('Discord.js'); // superclass for Discord.js API
const APIClient = require('./client.js');
const Player = require('./player.js');
const ytdl = require('ytdl-core');

/**
 * This class wraps all of the bot related methodology (commands, displays, responses)
 * Command prefix choice : +$
 */
class Bot {

    /* Instantiates the client and logins the bot with the Discord Dev Portal token */
    constructor(token) {

        /* Local classes helpers init */
        this.player = new Player(process.env.YT_TOKEN); // manages YT queries
		this.apiClient = new APIClient('http://0.0.0.0:5000/'); // makes API calls to thisStrain for a specific function
		this.reaction_numbers = [
			"\u0030\u20E3","\u0031\u20E3","\u0032\u20E3","\u0033\u20E3","\u0034\u20E3","\u0035\u20E3", "\u0036\u20E3","\u0037\u20E3","\u0038\u20E3","\u0039\u20E3"
		]; // Used for polls (emojis depicting digits)

        /* Discord API related */
        this.client = new Discord.Client();
        this.client.login(token);
        this.client.on('ready', () => {
            console.log(`Bot logged in as : ${this.client.user.tag}`);
            this.client.user.setActivity('people blazin up yo', {
                type: 'WATCHING'
            });
        });

    }

    /* Tests whether the bot is listening for messages by sending a PING and expecting a PONG */
    testBotConnection() {
        this.client.on('message', message => {
            if (message.content === 'ping') {
                message.reply('pong');
                console.log('Bot up and running !');
            }
        });
    }

    /* Connects to the thisStrain API, testing or making a classification using a base64encoded string image */
    thisStrainAPICall() {
        this.client.on('message', message => {
            if (message.content.startsWith('+$')) {
                if (message.content.startsWith('thisStrainTest', 2)) { // Tests API availability
                    this.apiClient.testAPIConnection((resp, err) => {
                        if (err) {
                            message.reply("API error");
                        } else {
                            message.reply("API working");
                        }
                    });
                }
                if (message.content.startsWith('thisStrainClassify', 2)) { // Classifies the last sent image attachment
                    message.reply('On it, chief !');
                    if (message.attachments.size > 0) {
                        message.reply('Found attachments...');
                        message.attachments.forEach(attachment => {
                            if (this.attachIsImage(attachment)) {
                                message.reply('Analyzing image...');
                                this.apiClient.getImageBase64FromURL(attachment.url, (response, err) => { // Get data from URL and make call in callback
                                    if (!err) {
                                        this.apiClient.makeSpecialCall('predictOnImage', response, (result) => {
                                            console.log(result);
                                            message.reply(`${result['output'][0]}, Accuracy: ${result['output'][1].toFixed(2)}%`);
                                        });
                                    } else {
                                        console.log('Error occured while getting image.');
                                    }
                                });
                            }
                        });
                    } else {
                        message.reply('No image found ! Attach an image and try the classifier afterwards.');
                    }
                }
            }
        });
    }

    /* Joins the current Voice Channel to get a Voice Connection & Proccesses other Voice Channel commands */
    async VoiceChannel() {
        this.client.on('message', async message => {
            if (message.content.startsWith('+$')) {
                if (message.content.startsWith('haos', 2)) { // budBOT joins the Voice Channel
                    if (!message.guild) {
                        return;
                    } // Voice Chat Rooms only work in guilds
                    else {
                        if (message.member.voice.channel) {
                            this.connection = await message.member.voice.channel.join(); // Join current channel
                            this.dispatcher = undefined;
                        } else {
                            message.reply('I need to join a voice channel first !')
                        }
                    }
                }
                if (message.content.startsWith('play', 2)) { // queries YT using the given input after the command
                    if (typeof this.connection !== 'undefined') {
                        // DEFINED CONNECTION
                        var results = undefined; // container for search results
                        this.player.youtubeSearch(message.content.substring(7, message.content.length), (data, err) => {
                            results = data;
                            /* Iterate through YT results and display them in a poll to play the song with the most votes */
                            message.channel.send({
                                embed: results.container
                            });
                            message.channel.messages.fetch({
                                limit: 1
                            }).then(messages => {
                                /*
                                 * I coulnd't get the poll reactions to be added to the Embedded message sent by the bot 
                                 * as the .fetch() always returned me the first to last message 
                                 * But I managed to get the embedded poll by sending a reply beforehand 
                                 */
                                message.reply('Wait for the 5 options to load and then choose your favourite');

                                message.channel.messages.fetch({
                                    limit: 1
                                }).then(messages => {
									var botPoll = messages.array()[0];
									var votes = [1, 1, 1, 1, 1]; // frequency array to get the most voted option
                                    botPoll.react(this.reaction_numbers[0]).then(() => botPoll.react(this.reaction_numbers[1]).then(() => botPoll.react(this.reaction_numbers[2]).then(() => botPoll.react(this.reaction_numbers[3]).then(() => botPoll.react(this.reaction_numbers[4]).then(() => {
										const collectFor = 7000; // amount of time to collect for in milliseconds
										const filter = (reaction) => {
											return this.reaction_numbers.includes(reaction.emoji.name);
										}; // gathering all reactions which depict digits 0 -> 4
										const collector = botPoll.createReactionCollector(filter, {
											time: collectFor
										});
                                        collector.on('collect', (reaction) => {
                                            if (reaction.emoji.name === this.reaction_numbers[0]) {
                                                votes[0] += 1;
                                            } else if (reaction.emoji.name === this.reaction_numbers[1]) {
                                                votes[1] += 1;
                                            } else if (reaction.emoji.name === this.reaction_numbers[2]) {
                                                votes[2] += 1;
                                            } else if (reaction.emoji.name === this.reaction_numbers[3]) {
                                                votes[3] += 1;
                                            } else if (reaction.emoji.name === this.reaction_numbers[4]) {
                                                votes[4] += 1;
											}
											else {
												console.log(`Reacted with ${reaction.emoji}`);
											}
                                        });
                                        collector.on('end', collected => {
                                            console.log(votes);
                                            /* Get the most voted option */
                                            var maxVotedOption = 0,
                                                maxVotes = 1;
                                            for (var index = 0; index < votes.length; index++) {
                                                if (votes[index] > maxVotes) {
                                                    maxVotedOption = index;
                                                    maxVotes = votes[index];
                                                }
                                            }
                                            /* Access & Play the video with the ID of the most voted option */
                                            const stream = ytdl('https://www.youtube.com/watch?v=' + results.values[maxVotedOption]['id'], {
                                                filter: 'audioonly'
                                            });
                                            this.dispatcher = this.connection.play(stream);
                                            this.dispatcher.on('finish', () => {
                                                console.log(results.values[maxVotedOption]['playlistID'])
                                                // this.connection.play(ytdl('https://www.youtube.com/watch?v=' + results.values[maxVotedOption]['playlistID'], { filter: 'audioonly' }));
                                            });
                                            this.dispatcher.on('error', console.error);
                                        });
                                    })))));
                                });
                            });
                        });
                    } else {
                        // UNDEFINED CONNECTION
                        message.reply('I have not joined your voice channel yet... HINT: +$haos');
                    }
                }
                if (message.content.startsWith('stop', 2)) { // ends bot stream
                    this.dispatcher.destroy();
                    message.reply('Queue cleared successfully bruv');
                }
            }
        });
    }

    /* OTHER HELPER FUNCTIONS */
    attachIsImage(attach) { // Checks if the image is a .png or .jpg/.jpeg
        var url = attach.url;
        if ((url.indexOf("png", url.length - "png".length) !== -1) || (url.indexOf("jpg", url.length - "jpg".length) !== -1)) {
            return true;
        }
        return false;
    }

}

module.exports = Bot;