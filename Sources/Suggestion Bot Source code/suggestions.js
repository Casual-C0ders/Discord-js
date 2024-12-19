const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const clientId = ''; // ضيف الايدي الخاص بالبوت
const guildId = ''; // ضيف الايدي حق السيرفر
const token = ''; // ضيف توكن البوت

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// الامر
const commands = [
  {
    name: 'sugg-channel',
    description: 'Set the channel for suggestions',
    options: [
      {
        name: 'channel',
        type: 7, 
        description: 'The channel to use for suggestions',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(token);
//نظام تحقق من اخطاء
// كود تحقق من تشغيل البوت يظهر في cmd
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// يشيك على القناه المحدده
let channelConfig = {};
if (fs.existsSync('./channel.json')) {
  channelConfig = JSON.parse(fs.readFileSync('./channel.json', 'utf8'));
}

// يبين لك ان البوت سجل دخول
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle interaction events
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'sugg-channel') {
    
    const channel = interaction.options.getChannel('channel');
    if (!channel || channel.type !== 0) { 
      return interaction.reply({
        content: 'الرجاء تحديد قناة نصية فقط',
        ephemeral: true,
      });
    }

    channelConfig[interaction.guildId] = { chat: channel.id };
    fs.writeFileSync('./channel.json', JSON.stringify(channelConfig, null, 2));

    return interaction.reply({
      content: `تم تحديد قناه الاقتراحات للقناه المختاره ${channel}.`,
      ephemeral: true,
    });
  }
});

// ياخذ معطيات الرساله
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const channelId = channelConfig[message.guildId]?.chat;
  if (message.channel.id === channelId) {
    const suggestionContent = message.content;

    // يحذف الرساله المرسله
    await message.delete();

    // رساله الامبيد
    const embed = new EmbedBuilder()
    .setDescription(`**${suggestionContent}**`)
      .setColor('#2CAEF6')
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    // يرسل الامبيد ويضيف الرياكشن
    const suggestionMessage = await message.channel.send({ embeds: [embed] });
    await suggestionMessage.react('👍'); // Upvote
    await suggestionMessage.react('👎'); // Downvote
  }
});

// Log the bot in
client.login(token);
