const { EmbedBuilder } = require('discord.js');

module.exports = (title, genre, url, server) => {
    const embed = new EmbedBuilder()
        .setTitle(':minidisc:  Now Playing')
        .setColor('#7491ed')
        .setDescription(`**Title:** ${title || 'Unknown Title'}\n**Genre:** ${genre || 'Unknown Genre'}\n**URL:** ${url || 'Unknown URL'}\n**Server:** ${server || 'Unknown Server'}`)
        .setTimestamp();

    return embed;
}