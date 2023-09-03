const { EmbedBuilder } = require('discord.js');

module.exports = (title, message) => {
    const embed = new EmbedBuilder()
        .setTitle('✅  ' + title || 'Unknown Title')
        .setColor('#77b255')
        .setDescription(message || 'Unknown Message')
        .setTimestamp();

    return embed;
}