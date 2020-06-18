/**
 * For the time being, the interpreter will be quite inneficient (?) 
 * as the voice commands will only be analysed through a simple algorithm 
 * TODO : Switch this interpreter to a ML model => 
 * => INPUT : Text
 * => OUTPUT : Basic Command Response (ie: Play music, send message)
 */

class VoiceCommandInterpreter {

    /* Uses a transcript from the Google Speech API and returns a command (to be used in getCommandType) */
    getCommand(voiceInput) {

        var command = { // Holds a score which indicates what kind of voice command was input
            'PLAY': 0, 
            'PAUSE': 0, 
            'STOP': 0, 
            'SENDMESSAGE': 0 
        };

        var inputArray = voiceInput.split(' '); // creating an array of all words in the input 
        for (const word of inputArray) {    
            console.log(word);
            switch (word) {
                case 'play':
                case 'song':
                case 'music':
                    command['PLAY'] += 1;
                    break;
                case 'pause':
                case 'song':
                    command['PAUSE'] += 1;
                    break;
                case 'stop':
                case 'song':
                case 'clear':
                    command['STOP'] += 1;
                    break;
                case 'send':
                case 'message':
                case 'chat':
                    command['SENDMESSAGE'] += 1;
                    break;                               
            }
        }
        return this.getCommandType(command);
    }

    /* Determines if a command is of type PLAY, SENDMESSAGE etc. using the score in the dictionary */
    getCommandType(command) {
        var maxCommandScore = 0;
        var commandType = 'default';
        for (var key in command) {
            if (command[key] > maxCommandScore) {
                maxCommandScore = command[key];
                commandType = key;
            }
        }
        return commandType;
    }

}

module.exports = VoiceCommandInterpreter;