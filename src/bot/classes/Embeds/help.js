const Discord = require('discord.js');

/**
 * Class containing an embedded container for the commands of the bot
 */
class HelpEmbed {

    constructor() {
        this.embeddedMessage = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Here's what I can do ;)`)
        .setDescription('First Row -> COMMAND & Second Row -> ACTION')

        .addField('ping', 'pong', false)

        .addField('+$haos', `Joins the caller's Voice Channel`, false)

        .addField('+$play SONG', 'Plays the given SONG / Adds it to the queue', false)

        .addField('+$pause | +$resume | +$stop', 'Pauses | Resumes | Stops the music stream', false)

        .addField('+$thisStrainTest', 'Tests if the thisStrain AI is available for use', false)

        .addField('+$thisStrainClassify + ATTACHMENT <.png/.jpg/.jpeg>', 'Uses the thisStrain AI to classify the strain of cannabis in the given picture', false)

    }

    get container() {
        return this.embeddedMessage;
    }

}
    
module.exports = HelpEmbed;