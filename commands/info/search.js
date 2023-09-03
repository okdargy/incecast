const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const errorEmbed = require('../../embeds/errorEmbed');

module.exports = {
    cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Searches for a radio station, powered by radio.garden')
        .addStringOption(
            option => option.setName('query')
                .setDescription('The query to search for')
                .setRequired(true)
        ),
	async execute(interaction) {
        //if(interaction.member.id !== '829105364234403870') return
		const input = interaction.options.getString('query');
        console.log(input);
        
        // sanitize input
        const pattern = /[^a-zA-Z0-9 ]/g;
        const sanitizedInput = input.replace(pattern, '');

        // fetch data from radio.garden
        const data = await fetch(`https://radio.garden/api/search?q=${sanitizedInput}&types=station&limit=10&offset=0`);
        const res = await data.json();

        // check if there are any results
        if (res.hits.hits.length === 0) {
            const embed = errorEmbed('No results found.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // create an array of results
        let desc = '';
        
        res.hits.hits.forEach((hit, index) => {
            desc += `**${hit._source.title}** - ${hit._source.subtitle} ${hit._source.secure ? ':lock:' : ':unlock:'}\n${hit._source.url}`;

            if (index !== res.hits.hits.length - 1) {
                desc += '\n\n';
            } else {
                desc += '\n\nUse the </play:1134211240047149248> command to play a station.';
            }
        })

        const embed = new EmbedBuilder()
            .setTitle(':mag:  Search Results')
            .setDescription(desc)
            .setColor('#7490ed')
            .setFooter({
                text: 'powered by radio.garden',
                iconURL: 'https://px.radio.garden/small/nkeutQ57.jpg'
            })

        return interaction.reply({ embeds: [embed], ephemeral: true });
	},
};