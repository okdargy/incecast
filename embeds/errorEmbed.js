const { EmbedBuilder } = require('discord.js');

module.exports = (message) => {
    const embed = new EmbedBuilder()
        .setTitle(':x:  Error')
        .setColor('#dd2e44')
        .setDescription(message || 'An unknown error has occurred.')

    return embed;
}