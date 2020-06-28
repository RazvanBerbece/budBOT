/* ---------- Requires ---------- */
const Discord = require('Discord.js'); // superclass for Discord.js API
const APIClient = require('./client.js');
const Player = require('./player.js');
const ytdl = require('ytdl-core');
const nowPlayingEmbed = require('./Embeds/playing.js');
const HelpEmbed = require('./Embeds/help.js');
const Silence = require('./VoiceOutputHandler/Silence/silence.js');
const fs = require('fs');
const fse = require('fs-extra');
const wavConverter = require('wav-converter');
const path = require('path');
const SpeechToTextClient = require('./VoiceOutputHandler/speechToTextClient/client.js');
const VoiceCommandInterpreter = require('./VoiceOutputHandler/VoiceCommand/commands.js');
var findRemoveSync = require('find-remove');

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

        /* Media Player Variables */
        this.connection = null;
        this.dispatcher = null;
        this.Queue = [];

        /* Voice Commands Variables */
        this.listener = false;
        this.currentGlobalCommand = '';

    }

    /* Tests whether the bot is listening for messages by sending a PING and expecting a PONG */
    testBotConnection() {
        this.client.on('message', message => {
            if (message.content === 'ping') {
                message.reply('pong');
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
        this.client.on('message', message => {
            if (message.content.startsWith('+$')) {
                if (message.content.startsWith('haos', 2)) { // budBOT joins the Voice Channel
                    this.joinVoiceChannel(message, (err, connection) => {
                        if (!err) {
                            this.connection = connection;
                        }
                    });
                }
                if (message.content.startsWith('play', 2)) { // queries YT using the given input after the command
                    if (typeof this.connection !== 'undefined') { // DEFINED CONNECTION
                        this.queryAndPlay(message.content.substring(7, message.content.length), message);
                    } else {
                        // UNDEFINED CONNECTION
                        message.reply('I have not joined your voice channel yet... HINT: +$haos');
                    }
                }
                if (message.content.startsWith('stop', 2) && message.content.length == 6) { // stops the current music stream
                    if (this.dispatcher) {
                        this.dispatcher.destroy();
                        message.reply('Queue cleared successfully bruv');
                    } else {
                        message.reply('Queue is already clear boss');
                    }
                }
                if (message.content.startsWith('pause', 2)) { // pauses the current music stream
                    if (this.dispatcher) {
                        this.dispatcher.pause();
                        message.reply('Queue paused bruv');
                    } else {
                        message.reply('Queue is already paused boss');
                    }
                }
                if (message.content.startsWith('resume', 2)) { // resumes the current music stream
                    if (this.dispatcher) {
                        this.dispatcher.resume();
                        message.reply('Queue resumed');
                    } else {
                        message.reply('Queue is already playing boss');
                    }
                }
                if (message.content.startsWith('skip', 2)) { // skips the current song in the queue
                    if (this.dispatcher) {
                        this.dispatcher.destroy();
                        this.joinVoiceChannel(message, (err, connection) => {
                            this.play(connection, message);
                        });
                    } else {
                        message.reply('There is no song to skip');
                    }
                }
                if (message.content.startsWith('upcoming', 2)) { // displays the current music queue
                    if (!this.Queue.length) {
                        message.channel.send(`No songs in queue at the moment chief`);
                    }
                    for (var index = 0; index < this.Queue.length; index++) {
                        message.channel.send(`${index+1}) ${this.Queue[index]['title']}`);
                    }
                }
                /* Listens to an user and outputs a file with the audio data */
                if (message.content.startsWith('listen', 2) && message.author.id == '573659533361020941') { // only listen to me for the time being
                    const _self = this;
                    _self.listener = true;
                    if (_self.connection && _self.listener) { // budBOT is already connected to a VC
                        _self.listenCommands(_self.connection, message, (err, transcription) => {
                            if (!err && _self.currentGlobalCommand == '') {
                                console.log(`VOICE RESULT : ${transcription}`);
                                _self.processVoiceCommand(transcription, message);
                            }
                        });
                    } else if (!_self.connection && _self.listener) { // needs connection
                        this.joinVoiceChannel(message, (err, connection) => {
                            if (!err) {
                                _self.listenCommands(connection, message, (err, transcription) => {
                                    if (!err) {
                                        _self.processVoiceCommand(transcription, message);
                                    }
                                });
                            }
                        });
                    }
                }
                if (message.content.startsWith('stoplistening', 2) && this.listener) {
                    this.listener = false;
                    this.client.user.setActivity('people blazin up yo', {
                        type: 'WATCHING'
                    });
                    message.channel.send('Stopped listening');
                }
            }
        });
    }

    /* Displays the embedded message containing all the available commands of the budBOT */
    getHelp() {
        this.client.on('message', message => {
            if (message.content === '+$help' || message.content === '+$') {
                const helperEmbed = new HelpEmbed();
                message.channel.send({
                    embed: helperEmbed.container
                });
            }
        });
    }

    /* OTHER HELPER FUNCTIONS */
    /* Checks if the image is a .png or .jpg/.jpeg */
    attachIsImage(attach) {
        var url = attach.url;
        if ((url.indexOf("png", url.length - "png".length) !== -1) || (url.indexOf("jpg", url.length - "jpg".length) !== -1)) {
            return true;
        }
        return false;
    }

    joinVoiceChannel(message, callback) {
        if (!message.guild) {
            return;
        } // budBOT media options only work in guilds
        else {
            if (message.member.voice.channel) {
                message.member.voice.channel.join()
                    .then(connection => {
                        return callback(false, connection);
                    })
                    .catch(console.log);
            } else {
                message.reply('Song queued but I need to join a channel first ! HINT : +$haos');
                return callback(true, null);
            }
        }
    }

    /* Wrapper for the song poll & player */
    queryAndPlay(query, message) {
        const _self = this;
        _self.player.youtubeSearch(query, function(err, results) {
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
                        }
                    });
                    collector.on('end', collected => {
                        /* Get the most voted option */
                        var maxVotedOption = 0,
                            maxVotes = 1;
                        for (var index = 0; index < votes.length; index++) {
                            if (votes[index] > maxVotes) {
                                maxVotedOption = index;
                                maxVotes = votes[index];
                            }
                        }
                        if (_self.dispatcher) {
                            _self.Queue.push({
                                'id': results.values[maxVotedOption]['id'],
                                'title': results.values[maxVotedOption]['title'],
                                'thumbnail': results.values[maxVotedOption]['thumbnail'],
                                'desc': results.values[maxVotedOption]['desc']
                            });
                            message.channel.send('Song queued');
                        } else {
                            _self.Queue.push({
                                'id': results.values[maxVotedOption]['id'],
                                'title': results.values[maxVotedOption]['title'],
                                'thumbnail': results.values[maxVotedOption]['thumbnail'],
                                'desc': results.values[maxVotedOption]['desc']
                            });
                            _self.joinVoiceChannel(message, (err, connection) => {
                                if (!err) {
                                    _self.play(connection, message);
                                }
                            });
                        }
                    });
                });
            }
        });
    }

    /* Wrapper for the connection.play() method */
    play(connection, message) {

        const nowPlaying = new nowPlayingEmbed(this.Queue[0]['title'], this.Queue[0]['thumbnail'], this.Queue[0]['desc']);
        message.channel.send({
            embed: nowPlaying.container
        });

        const stream = ytdl('https://www.youtube.com/watch?v=' + this.Queue[0]['id'], {
            quality: 'highestaudio'
        });
        this.dispatcher = connection.play(stream);

        this.Queue.shift();

        this.dispatcher.on('finish', () => {
            if (this.Queue[0]) {
                this.play(connection, message);
            } else {
                this.dispatcher = null;
            }
        });
        this.dispatcher.on('error', console.error);
    }

    /**
     * Listens to Voice Commands after being given access to do this
     * Returns a callback (error, VoiceCommandToText)
     */
    listenCommands(connection, message, callback) {
        const _self = this;
        _self.listener = false; // while processing a voice command, the bot won't be listening
        /* Make changes based on current bot behaviour : listening */
        this.client.user.setActivity('people blazin up yo', {
            type: 'LISTENING'
        });
        const receiver = connection.receiver;
        /* Required piece of code, so that the speaking receiver works :( */
        connection.play(new Silence(), {
            type: 'opus'
        });
        connection.on('speaking', (user, speaking) => {
            if (speaking) {
                if (user.id != '573659533361020941') { // TEMPORARY : ONLY LISTEN TO ME
                    message.channel.send('This function can only be used by --AntoBc#7863-- at the moment, hang on');
                } else {
                    const audioStream = receiver.createStream(user, {
                        mode: "pcm"
                    });
                    const dateNow = Date.now();
                    const source = __dirname + `/VoiceOutputHandler/` + `audiodata/` + `${user.id}_${dateNow}.pcm`;
                    const wavDestination = __dirname + `/VoiceOutputHandler/` + `audiodata/` + `${user.id}_${dateNow}.wav`;
                    /* To avoid 'File not found' errors, we make sure to create the source first */
                    fse.outputFile(source, '', err => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('The input file was created!');
                        }
                    });
                    fse.outputFile(wavDestination, '', err => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('The output file was created!');
                        }
                    });
                    var destination = fs.createWriteStream(source);
                    audioStream.on('data', (packet) => {
                        destination.write(packet);
                    });
                    audioStream.on('end', () => {
                        destination.end();
                        /* Convert .pcm to .wav */
                        var pcmData = fs.readFileSync(path.resolve(__dirname, source));
                        var wavData = wavConverter.encodeWav(pcmData, {
                            numChannels: 2,
                            sampleRate: 48000,
                            byteRate: 16
                        });
                        fs.writeFileSync(path.resolve(__dirname, wavDestination), wavData);
                        /* Make API Call to GCloud Speech-To-Text through the written class */
                        const speechtotext = new SpeechToTextClient(wavDestination);
                        speechtotext.getTextTranscript((err, transcription) => {
                            if (err) {
                                _self.listener = true;
                                callback(err, null);
                            } else {
                                _self.listener = true;
                                callback(null, transcription);
                            }
                        });
                        if (_self.listener) {
                            _self.listenCommands(_self.connection, message, callback);
                        }
                    });
                }
            }
        });
    }

    processVoiceCommand(transcript, message) {
        const _self = this;
        const interpreter = new VoiceCommandInterpreter();
        const commandResult = interpreter.getCommand(transcript);
        if (commandResult[0] != 'default') {
            switch (commandResult[0]) {
                case 'PLAY':
                    _self.currentGlobalCommand = 'PLAY';
                    message.channel.send(commandResult[1])
                        .then(function(message) {
                            _self.listenCommands(_self.connection, message, (err, transcription) => {
                                if (!err) {
                                    if (_self.currentGlobalCommand === 'PLAY') {
                                        console.log(`INSIDE PROCESSING : ${transcription}`);
                                        _self.currentGlobalCommand = '';
                                        _self.queryAndPlay(transcription, message);
                                    }
                                }
                            });
                            console.log('Processing second instruction');
                        });
                case 'PAUSE':
                    if (_self.dispatcher) {
                        message.channel.send(commandResult[1]);
                        _self.dispatcher.pause();
                    }
                case 'RESUME':
                    if (_self.dispatcher) {
                        message.channel.send(commandResult[1]);
                        _self.dispatcher.resume();
                    }
                case 'SENDMESSAGE':
                    // TODO
                    message.channel.send(commandResult[1]);
            }
        }
    }

    /* Cleans up unnecessary files created by the bot */
    cleanup() {
        setInterval(findRemoveSync.bind(this,__dirname + '/VoiceOutputHandler/audiodata', {
            age: {seconds: 25},
            files: '*.*'
        }), 10);
    }

    /* Runs all bot command listening functions */
    runBot() {
        this.getHelp();
        this.testBotConnection();
        this.thisStrainAPICall();
        this.VoiceChannel();
        this.cleanup();
    }

}

module.exports = Bot;