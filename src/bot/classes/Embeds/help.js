const Discord = require('discord.js');

/**
 * Class containing an embedded container for the commands of the bot
 */
class HelpEmbed {

    constructor() {
        this.embeddedMessage = new Discord.MessageEmbed()
        .attachFiles(['./src/bot/classes/Embeds/assets/budBOTlogo.png'])
        .setColor('#0099ff')
        .setTitle(`Here's what I can do ;)`)
        .setDescription('Commands :')
        .setThumbnail('attachment://budBOTlogo.png')

        .addField('ping', 'budBOT says pong', false)

        .addField('+$haos', `budBOT joins the caller's Voice Channel`, false)
        .addField('+$play SONG', 'budBOT prompts a vote poll for the song you want to play and then plays the given SONG or adds it to the queue', false)
        .addField('+$pause | +$resume | +$stop | +$skip', 'budBOT Pauses | Resumes | Stops the music stream | Skips the current song', false)
        .addField('+$upcoming', 'budBOT lists the upcoming songs in the queue', false)

        .addField('+$thisStrainTest', 'budBOT tests if the thisStrain AI is available for use', false)
        .addField('+$thisStrainClassify + ATTACHMENT <.png/.jpg/.jpeg>', 'budBOT uses the thisStrain AI to classify the strain of cannabis in the given picture', false)

    }

    get container() {
        return this.embeddedMessage;
    }

}
    
module.exports = HelpEmbed;