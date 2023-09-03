const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, getVoiceConnection, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const errorEmbed = require('../../embeds/errorEmbed');
const successEmbed = require('../../embeds/successEmbed');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reconnect')
		.setDescription('Reconnects to the audio player if bot is still in the voice channel.'),
	async execute(interaction) {
        if (!interaction.guild.members.me.voice.channel) {
            return interaction.reply({ embeds: [errorEmbed('Bot is not connected to a voice channel. Use the </connect:1134175398595395604> command to connect the bot to your voice channel.')] });
        }

        if(!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [errorEmbed('You must be in a voice channel to use this command.')] });
        }

        if(interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
            return interaction.reply({ embeds: [errorEmbed('You must be in the same voice channel as the bot to use this command.')] });
        }

        let connection = getVoiceConnection(interaction.guildId);

        if(!connection) {
            connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log('The connection has entered the Ready state - ready to play audio!');
            });

            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                console.log("Disconnected from player...")
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                    // Seems to be reconnecting to a new channel - ignore disconnect
                } catch (error) {
                    // Seems to be a real disconnect which SHOULDN'T be recovered from
                    connection.destroy();
                }
            });

            connection.on(VoiceConnectionStatus.Connecting, () => {
                console.log('The connection has entered the Connecting state!');
            });
    
            connection.on(VoiceConnectionStatus.Signalling, () => {
                console.log('The connection has entered the Signalling state!');
            });
    
            connection.on(VoiceConnectionStatus.Destroyed, () => {
                console.log('The connection has been destroyed.');
            });

            connection.on('error', error => {
                console.log(error)   
            })
        } else {
            console.log(connection.state.subscription.player)
            if(connection.state.subscription.player) {
                return interaction.reply({ embeds: [errorEmbed('Bot is already connected to an audio player.')] });
            }
        }

        // create an audio player
        const player = createAudioPlayer();

        // subscribe the audio player to the voice connection
        connection.subscribe(player);
        connection.player = player;

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('The audio player has become idle.');
            player.play(getNextResource());
        });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing.');
        });

        player.on(AudioPlayerStatus.Paused, () => {
            console.log('The audio player has paused.');
        });

        player.on(AudioPlayerStatus.AutoPaused, () => {
            console.log('The audio player has been paused by the player itself.');
        });

        player.on(AudioPlayerStatus.Buffering, () => {
            console.log('The audio player is buffering.');
        });

        return interaction.reply({ embeds: [
            successEmbed('Reconnected', 'Successfully reconnected back to audio player. Try playing a station!')
        ] });
	},
};