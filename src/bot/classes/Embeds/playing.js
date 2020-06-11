const Discord = require('discord.js');

/**
 * Class containing embedded container for the 'Now playing ...' event
 */
class NowPlayingEmbed {

    constructor(title, thumbnail, desc) {
        this.embeddedMessage = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Now playing : ${title} ...`)
        .setDescription(desc)
        .setImage(thumbnail)
        .setTimestamp()
    }

    get container() {
        return this.embeddedMessage;
    }

}
    
module.exports = NowPlayingEmbed;