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

        /* Discord API related */
        this.client = new Discord.Client();
        this.client.login(token);
        this.client.on('ready', () => {
            console.log(`Bot logged in as : ${this.client.user.tag}`);
            this.client.user.setActivity('people blazin up yo', {
                type: 'WATCHING'
            });
		});
		
		/* Player Variables */
		this.connection = undefined;
		this.dispatcher = undefined;

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
    VoiceChannel() {
        this.client.on('message', async message => {
            if (message.content.startsWith('+$')) {
                if (message.content.startsWith('haos', 2)) { // budBOT joins the Voice Channel
                    if (!message.guild) {
                        return;
                    } // Voice Chat Rooms only work in guilds
                    else {
                        if (message.member.voice.channel) {
							this.connection = await message.member.voice.channel.join() // Join current channel
                        } else {
                            message.reply('I need to join a voice channel first !')
                        }
                    }
                }
                if (message.content.startsWith('play', 2)) { // queries YT using the given input after the command
                    if (typeof this.connection !== 'undefined') {
                        // DEFINED CONNECTION
                        this.player.youtubeSearch(message.content.substring(7, message.content.length), function(err, results) {
                            if (err) {
                                console.log(err);
                            } else {
                                message.channel.send({
                                    embed: results.container
                                }).then(async function(message) {

                                    await message.react('0️⃣');
                                    await message.react('1️⃣');
                                    await message.react('2️⃣');
                                    await message.react('3️⃣');
                                    await message.react('4️⃣');

                                    var votes = [1, 1, 1, 1, 1]; // frequency array to get the most voted option
                                    const collectFor = 5000; // amount of time to collect for in milliseconds
                                    const filter = (reaction) => {
                                        return ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣'].includes(reaction.emoji.name);
                                    }; // gathering all reactions which depict digits 0 -> 4
                                    var collector = message.createReactionCollector(filter, {
                                        time: collectFor
                                    });
                                    collector.on('collect', (reaction) => {
                                        if (reaction.emoji.name === '0️⃣') {
                                            votes[0] += 1;
                                        } else if (reaction.emoji.name === '1️⃣') {
                                            votes[1] += 1;
                                        } else if (reaction.emoji.name === '2️⃣') {
                                            votes[2] += 1;
                                        } else if (reaction.emoji.name === '3️⃣') {
                                            votes[3] += 1;
                                        } else if (reaction.emoji.name === '4️⃣') {
                                            votes[4] += 1;
                                        } else {
                                            console.log(`Reacted with ${reaction.emoji}`);
                                        }
                                    });
                                    collector.on('end', collected => {
                                        console.log(collected);
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
										message.reply(`playing ${results.values[maxVotedOption]['title']} ...`);
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
                                });
                            }
                        });
                    } else {
                        // UNDEFINED CONNECTION
                        message.reply('I have not joined your voice channel yet... HINT: +$haos');
                    }
                }
				if (message.content.startsWith('stop', 2)) { // ends bot stream
					if (typeof this.dispatcher !== 'undefined') {
                    	this.dispatcher.destroy();
						message.reply('Queue cleared successfully bruv');
					} else {
						message.reply('Queue is already clear boss');
					}
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