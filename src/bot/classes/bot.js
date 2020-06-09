/* ---------- Requires ---------- */
const Discord = require('Discord.js'); // superclass for Discord.js API
const APIClient = require('./client.js');
const Player = require('./player.js');

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
            this.client.user.setActivity('people blazin up yo', { type: 'WATCHING' });
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
                        }
                        else {
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
                                    }
                                    else {
                                        console.log('Error occured while getting image.');
                                    }
                                });
                            }
                        });
                    }
                    else {
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
                    if (!message.guild) { return; } // Voice Chat Rooms only work in guilds
                    else {
                        if (message.member.voice.channel) {
                            this.connection = await message.member.voice.channel.join(); // Join current channel
                        }
                        else {
                            message.reply('I need to join a voice channel first !')
                        }
                    }
                }
                if (message.content.startsWith('play', 2)) { // queries YT using the given input after the command
                    if (typeof this.connection !== 'undefined') {
                        // DEFINED CONNECTION
                        const results = await this.player.youtubeSearch(message.content.substring(7, message.content.length));
                        /* Iterate through YT results and display them in a poll to play the song with the most votes */
                        message.channel.send({ embed: results });
                        /*
                        this.client.channels.cache.get(this.client.voiceConnections.get('422388895561547777').channel.id).then(channel => {
                            channel.fetchMessages({ limit: 1 }).then(message => {
                                const lastBotMessage = message.array()[0];
                                if (lastBotMessage.author.id == this.client.user.tag) {
                                    lastMessage.react('0️⃣').then(() => message.react('1️⃣').then(() => message.react('2️⃣').then(() => message.react('3️⃣').then(() => message.react('4️⃣')))));
                                }
                            }); 
                        });
                        */
                    }
                    else {
                        // UNDEFINED CONNECTION
                        message.reply('I have not joined your voice channel yet...');
                    }
                }
            }
        })
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