const { SlashCommandBuilder, PermissionsBitField  } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { defaultStream } = require('../../config.json');

const errorEmbed = require('../../embeds/errorEmbed');
const successEmbed = require('../../embeds/successEmbed');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connects to the voice channel you are in.')
        .addStringOption(
            option => option.setName('stream')
                .setDescription('The stream URL to play.')
        ).addBooleanOption(
            option => option.setName('debug')
                .setDescription('Whether to enable debug mode.')
        ),
	async execute(interaction) {
        if (!interaction.member.voice.channel) {
            const embed = errorEmbed('You must be in a voice channel to use this command.');
            return interaction.reply({ embeds: [embed] });
        }

        // check if bot is already in a voice channel
        if (interaction.guild.members.me.voice.channel) {
            const embed = errorEmbed('Bot is currently in a voice channel. Please disconnect the bot first.');
            return interaction.reply({ embeds: [embed] });
        }

        // make sure bot can join the voice channel
        const permissions = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);
        
        if(!permissions.has(PermissionsBitField.Flags.Connect)) {
            const embed = errorEmbed('I don\'t have permission to join your voice channel.');
            return interaction.reply({ embeds: [embed] });
        }
        
        // join the voice channel
        const connection = joinVoiceChannel({
            debug: interaction.options.getBoolean('debug') || false,
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('The connection has entered the Ready state - ready to play audio!');
        });

        connection.on(VoiceConnectionStatus.Signalling, () => {
            console.log('The connection has entered the Signalling state!');
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

        connection.on('debug', message => {
            console.log("[DEBUG]", message)
        })

        // create an audio player
        const player = createAudioPlayer();
        connection.subscribe(player);

        if(interaction.options.getString('stream')) {
            // check if stream is a valid URL
            const pattern = /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g;
            if(!interaction.options.getString('stream').match(pattern)) {
                return interaction.reply('Invalid stream URL.');
            }
            
            // create an audio resource from a stream
            const resource = createAudioResource(interaction.options.getString('stream'), { inlineVolume: true });

            // play the audio resource
            connection.state.subscription.player.play(resource);
        } else {
            // create an audio resource from a stream
            const resource = createAudioResource(defaultStream, { inlineVolume: true });
            player.play(resource);
        }

        // log idle
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

        // log errors
        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        return interaction.reply({ embeds: [
            successEmbed('Successfully connected!', 'Connected to voice channel. Do you hear me?')
        ] });
	},
};