const { SlashCommandBuilder,PermissionsBitField, PermissionFlagsBits, EmbedBuilder, ActivityType  } = require('discord.js');
const { createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs')
const errorEmbed = require('../../embeds/errorEmbed');
const nowPlayingEmbed = require('../../embeds/nowPlaying');
const IcecastMetadataStats = require('../../util/stats')
async function getFinalRedirect(url) {
    const res = await fetch(url)
    return res.url
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a different station based off of station ID')
        .addStringOption(
            option => option.setName('id')
                .setDescription('The station ID to play.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR),
	async execute(interaction) {
		// check if user is in the same voice channel as bot
        if (!interaction.member.voice.channel) {
            const embed = errorEmbed('You must be in a voice channel to use this command.');
            return interaction.reply({ embeds: [embed] });
        }

        // check if bot is already in a voice channel
        if (!interaction.guild.members.me.voice.channel) {
            const embed = errorEmbed('Bot is currently not in a voice channel. Please connect the bot first.');
            return interaction.reply({ embeds: [embed] });
        }

        // check if user is in the same voice channel as bot
        if (interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
            const embed = errorEmbed('You must be in the same voice channel as the bot to use this command.');
            return interaction.reply({ embeds: [embed] });
        }

        //  https://radio.garden/api/ara/content/listen/b2LTYNLE/channel.mp3

        // example: b2LTYNLE
        // make sure that the id response is ONLY these
        const pattern = /^[a-zA-Z0-9_-]{8}$/;
        const text = interaction.options.getString('id');

        console.log(text)
        if(!pattern.test(text)) {
            const embed = errorEmbed('Please provide a valid station ID.');
            return interaction.reply({ embeds: [embed] });
        }
    
        const connection = getVoiceConnection(interaction.guildId);

        if(connection) {
            if(connection.state.subscription.player) {
                fetch(`https://radio.garden/api/ara/content/listen/${interaction.options.getString('id')}/channel.mp3`).then(async (data) => {
                    if(data.status !== 404) {
                        // create an audio resource from a stream
                        try {
                            const resource = await createAudioResource(data.url);
                            connection.state.subscription.player.play(resource); // play to the audio player

                            const embed = nowPlayingEmbed(
                                data.headers.get('icy-name'),
                                data.headers.get('icy-genre'),
                                data.headers.get('icy-url'),
                                data.headers.get('server')
                            );

                            if(connection.statsListener) connection.statsListener.stop()
                            connection.statsListener = new IcecastMetadataStats(data.url, {
                                onStats: (stats => {
                                    if(stats) {
                                        // Is this source Icecast? (also i hate icecast admins that put ?value in their listenurl)
                                        let icecast = []
                                        
                                        // if icestats is defined in stats
                                        if(stats.icestats) {
                                            icecast = stats.icestats.source.filter(point => point.listenurl.split('/').pop().split('?')[0].toLowerCase() == data.url.split('/').pop().split('?')[0].toLowerCase())
                                        }
                    
                                        // Title
                                        const title = icecast[0] ? icecast[0].title : null ||
                                        stats.icy ? stats.icy.StreamTitle : null ||
                                        stats.ogg ? stats.ogg.TITLE : null
                                        // Artist
                                        const artist = icecast[0] ? icecast[0].artist : null ||
                                        stats.ogg ? stats.ogg.ARTIST : null
                                        
                                        // Discord might try to rate limit
                                        try {
                                            interaction.client.user.setActivity(`${title || "Unknown Title"} - ${artist || "Unknown Artist"} ${icecast[0] ? '(' + icecast[0].listeners + ' listening)' : '(Playing)'}`, { type: ActivityType.Listening });
                                        } catch(err) {
                                            console.log(err)
                                        }
                                    } else {
                                        try {
                                            interaction.client.user.setActivity('Unknown Title - Unknown Artist (Playing)', { type: ActivityType.Listening });
                                        } catch(err) {
                                            console.log(err)
                                        }
                    
                                        connection.statsListener.stop()
                                    }
                                }),
                                interval: 15,
                                sources: ['icy', 'ogg', 'icestats']
                            })
                            connection.statsListener.start()

                            return interaction.reply({ embeds: [embed] });
                        } catch(err) {
                            return interaction.reply({
                                embeds: [errorEmbed("Bot crashed, failed to play resource. <@829105364234403870>\n\n```" + err + "```")]
                            })
                        }
                    } else {
                        return interaction.reply({
                            embeds: [errorEmbed("Stream URL returned 404, not able to play.")]
                        })
                    }
                }).catch(err => {
                    return interaction.reply({
                        embeds: [
                            errorEmbed("Failed to fetch common API redirect. <@829105364234403870>\n\n```" + err + "```")
                        ]
                    })
                })
            } else {
                return interaction.reply({ embeds: [
                    errorEmbed('Bot is not connected to an audio player. Please use the </reconnect:1134308130478632970> command to reconnect!')
                ] });
            }
        } else {
            return interaction.reply({ embeds: [
                errorEmbed('Bot is not connected to the voice channel. Please use the </reconnect:1134308130478632970> command to reconnect!')
            ] });
        }
	},
};