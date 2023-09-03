const { SlashCommandBuilder,PermissionsBitField, PermissionFlagsBits, EmbedBuilder, ActivityType } = require('discord.js');
const { createAudioResource, StreamType, getVoiceConnection } = require('@discordjs/voice');
const errorEmbed = require('../../embeds/errorEmbed');
const nowPlayingEmbed = require('../../embeds/nowPlaying');
const IcecastMetadataStats = require('../../util/stats')

function isValidURL(str) {
    if(/^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(str)) {
         return true
     } else {
         return false
     }
 }

module.exports = {
	data: new SlashCommandBuilder()
		.setName('change')
		.setDescription('Changes stream URL')
        .addStringOption(
            option => option.setName('stream')
                .setDescription('The stream URL to play.')
                .setRequired(true)
        ).addStringOption(option =>
            option.setName('type')
                .setDescription('The type of stream to play. For nerds, don\'t mess with this if you don\'t know what you\'re doing.')
                .addChoices(
                    { name: 'Arbitrary', value: 'arbitrary' },
                    { name: 'OggOpus', value: 'oggopus' },
                    { name: 'Opus', value: 'opus' },
                    { name: 'WebmOpus', value: 'webmopus' },
                    { name: 'Raw', value: 'raw' },
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR),
	async execute(interaction) {
		// check if user is in the same voice channel as bot
        if (!interaction.member.voice.channel) return interaction.reply({ embeds: [
            errorEmbed('You must be in a voice channel to use this command.')
        ]});

        // check if bot is already in a voice channel
        if (!interaction.guild.members.me.voice.channel) return interaction.reply({ embeds: [
            errorEmbed('Bot is currently not in a voice channel. Please connect the bot first.')
        ]});

        // check if user is in the same voice channel as bot
        if (interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) return interaction.reply({ embeds: [
            errorEmbed('You must be in the same voice channel as the bot to use this command.')
        ]});
        
        const connection = getVoiceConnection(interaction.guildId);

        if(!connection) return interaction.reply({ embeds: [
            errorEmbed('Bot is not connected to the voice channel. Please use the </reconnect:1134308130478632970> command to reconnect!')
        ]});


        if(!connection.state.subscription.player) return interaction.reply({ embeds: [
            errorEmbed('Bot is not connected to an audio player. Please use the </reconnect:1134308130478632970> command to reconnect!')
        ]});

        // check if stream is a valid URL
        if(isValidURL(interaction.options.getString('stream')) == false) {
            const embed = errorEmbed('Please provide a valid stream URL.');
            return interaction.reply({ embeds: [embed] });
        }

        const data = await fetch(interaction.options.getString('stream'))
        const type = interaction.options.getString('type');

        let params = {};

        switch(type) {
            case 'arbitrary':
                params = {
                    inputType: StreamType.Arbitrary
                };
                break;
            case 'oggopus':
                params = {  
                    inputType: StreamType.OggOpus
                };
                break;
            case 'opus':
                params = {
                    inputType: StreamType.Opus
                };
                break;
            case 'webmopus':
                params = {
                    inputType: StreamType.WebmOpus
                };
                break;
            case 'raw':
                params = {
                    inputType: StreamType.Raw
                };
                break;
            default:
                params = {}
        }
        
        // create an audio resource from a stream
        const resource = createAudioResource(interaction.options.getString('stream'), params);
        connection.state.subscription.player.play(resource);

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
	},
};