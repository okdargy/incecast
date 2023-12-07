## <p style="text-align: center;">Incecast</p>
<p style="text-align: center;">A discord bot to listen to online radios with search capabilities</p>

> [!WARNING]  
> @discordjs/voice currently does not support ARM64 architecture. Tested to work on an AMD64 architecture.

## Features
- 📻 Listen to radio streams
- 🔍 Search for radios (from [radio.garden API](https://radio.garden))
- 💬 Project current playing song to bot status

## Installation
1. Clone the repository
```bash
git clone https://github.com/okdargy/incecast
```

2. Install dependencies
```bash
npm install
```

3. Install `ffmpeg`

This step is required for @discordjs/voice to work. You can install ffmpeg from [here](https://ffmpeg.org/download.html). 

> [!IMPORTANT]
> We recommend you **not** to use ffmpeg-static as it is very unstable is almost guaranteed to crash.

4. Rename the `config.example.json` file to `config.json` and fill in the required fields.
```json
{
    "token": "",
    "clientId": "",
    "guildId": "",
    "defaultStream": ""
}
```

5. Deploy the commands
> This will deploy to only the server in the `guildId` variable
```bash
node deploy.js
```

6. Start the bot
```bash
node index.js
```

## Usage
### Commands
Incecast uses slash commands to interact with the bot. You can find the list of commands below.
| Command | Description |
| --- | --- |
| `/play` | Play a radio stream from radio.garden |
| `/search` | Search for a radio stream from radio.garden |
| `/connect` | Connect the bot to your voice channel |
| `/change` | Change the radio stream to a custom URL |
| `/reconnect` | Reconnect the bot to your voice channel |
| `/ping` | Advanced debugging and pong! |

## Screenshots

| ![Displaying bot status](https://i.imgur.com/jeaedk2.png) |
|:--:| 
| *Showing what bot stauts looks like* |

| ![Command usage](https://i.imgur.com/jAsyFh7.png) |
|:--:| 
| *Working searching and playing radio stations* |

## Thanks to...
### [radio.garden](https://radio.garden)
Having such an amazing API and the root inspiration for this bot

### The whole RWB team
I'd like to thank the [Running With Bricks](https://github.com/Running-With-Bricks) group for supporting the creation of this bot and showing interest!
