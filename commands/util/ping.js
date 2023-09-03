const { SlashCommandBuilder } = require('discord.js');
const { createAudioResource, StreamType, generateDependencyReport, getVoiceConnection } = require('@discordjs/voice');
const errorEmbed = require('../../embeds/errorEmbed');
const successEmbed = require('../../embeds/successEmbed');
var os = require('os');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addBooleanOption(option => option.setName('developer').setDescription('Shows developer information')),
	async execute(interaction) {
		if(interaction.options.getBoolean('developer')) {
			return interaction.reply({ embeds: [successEmbed(':ping_pong:  Pong!', `${generateDependencyReport()}\nOperating System\n- type: ${os.type()}\n- platform: ${os.platform()}\n- arch: ${os.arch()}\n- release: ${os.release()}\n- uptime: ${os.uptime()}\n--------------------------------------------------\nLatency\n- latency: ${Date.now() - interaction.createdTimestamp}ms\n- api ping: ${interaction.client.ws.ping}ms\n--------------------------------------------------`)] });
		} else {
			return interaction.reply({ embeds: [successEmbed(':ping_pong:  Pong!', `Latency: ${Date.now() - interaction.createdTimestamp}ms\nAPI Latency: ${interaction.client.ws.ping}ms`)] });
		}
	},
};