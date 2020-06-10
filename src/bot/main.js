/* ---------- Requires ---------- */

require('dotenv').config(); // token security

const Bot = require('./classes/bot.js');

/* ---------- Instantiate bot and call the listening functions ---------- */
    
const budBOT = new Bot(process.env.BOT_TOKEN);
budBOT.testBotConnection();
budBOT.thisStrainAPICall();
budBOT.VoiceChannel();