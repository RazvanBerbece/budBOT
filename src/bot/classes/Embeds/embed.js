const Discord = require('discord.js');

/**
 * Class containing embedded container for various data (ie: used for YT queries through Player)
 */
class Embedded {

    constructor(results) {
        this.valuesDict = results; // also saving the data source out of which the poll is created
        this.embeddedMessage = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Lets light this up yo')
        .setDescription('Vote below the song you want to hear')

        .addField(results['0']['title'], results['0']['desc'], true)
        .addField('Info', `Vote '0'`, true)
        .addField('\u200B', '\u200B')

        .addField(results['1']['title'], results['1']['desc'], true)
        .addField('Info', `Vote '1'`, true)
        .addField('\u200B', '\u200B')

        .addField(results['2']['title'], results['2']['desc'], true)
        .addField('Info', `Vote '2'`, true)
        .addField('\u200B', '\u200B')

        .addField(results['3']['title'], results['3']['desc'], true)
        .addField('Info', `Vote '3'`, true)
        .addField('\u200B', '\u200B')

        .addField(results['4']['title'], results['4']['desc'], true)
        .addField('Info', `Vote '4'`, true)

        .setTimestamp()
    }

    get container() {
        return this.embeddedMessage;
    }

    get values() {
        return this.valuesDict;
    }

}
    
module.exports = Embedded;