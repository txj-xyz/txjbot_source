var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var Discordie;
try { Discordie = require("discordie"); } catch(e) {}

var client = new Discordie();
client.Messages.setMessageLimit(10);

process.on('uncaughtException', function (err) {
  console.log("uncaughtException " + (err && err.stack ? err.stack : err));
});
try { auth = require("./auth.js"); } catch(e) {}

function connect() { client.connect(auth); }
connect();
var voiceconnectionhashmap={};

client.Dispatcher.on(Discordie.Events.GATEWAY_READY, (e) => {
  console.log(e)
  console.log("LOGIN MESSAGE")
	const guild = client.Guilds.getBy("name", "test");
	if (guild) {
		const general = guild.voiceChannels.filter(c => c.name == "General")[0];
		if (general)
			return general.join(false, false);
	}
});

client.Dispatcher.on(Discordie.Events.VOICE_DISCONNECTED, (e) => {
	try{
		var guild = e.voiceConnection.guild;
		var guildId = e.voiceConnection.guildId;
		var connection = voiceconnectionhashmap[guildId];
		stop(connection);
		delete voiceconnectionhashmap[guildId];
	}catch(e){
	console.log(e)
	}
});

client.Dispatcher.on(Discordie.Events.DISCONNECTED, (e) => {
  console.log(e)
	const delay = 5000;
	const sdelay = Math.floor(delay/100)/10;

	if (e.error.message.indexOf("gateway") >= 0) {
		console.log("Disconnected from gw, resuming in " + sdelay + " seconds");
	}else{
		console.log("Failed to log in or get gateway, reconnecting in " + sdelay + " seconds");
	}
	setTimeout(connect, delay);
});


var commands = {
	"avatar": {
		"command": function(data,e) {
			if(!data.args[1]){
				e.message.channel.sendMessage("You forgot to add arguments. - Usage: `/avatar <mention_someone>`")
				return
			}else if((e.message.mentions[0] || {}).avatar == undefined){
				e.message.channel.sendMessage("You forgot to mention someone. - Usage: `/avatar <mention_someone>`")
				return
			}else{
				e.message.channel.sendMessage("Here is <@"+ data.args[1].substr(2, data.args[1].length - 3) +"> 's Avatar.\nhttps://discordapp.com/api/users/"+data.args[1].substr(2, data.args[1].length - 3)+"/avatars/"+(e.message.mentions[0] || {}).avatar+".jpg")
			}
		},
		"description": "Pulls a mentioned users Avatar image :) - Usage: /avatar <mention_someone>",
		"authLevel": 0
	},
	"audiolist": {
		"command": function(data,e) {
			var fs = require('fs');
			fs.readdir("./audio", function (err, files) {
				files = files.map(function(file) {
					return file.substring(0, file.indexOf('.'));
				}).join('\n');
				e.message.channel.sendMessage("I sent you a message with all my audio files in a list! :)")
				client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage("Bot, Audio Listing **(Usage for listening: /audio <filename>)**\n"+"``` "+files+" ```"))
			});
		},
		"description": "Lists all audiofiles on server.",
		"authLevel": 0
	},
	"audio": {
		"command": function(data,e) {
			var fsExists = require('fs-exists')
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			var botvoiceid = client.User.getVoiceChannel(e.message.channel.guild)
			if(!botvoiceid){
				e.message.reply("I am not in a voice channel, please use `/jv` or `/vjoin`")
				return
			}
			if(!connection){
				e.message.reply("Not in a voice channel. Use: `/vjoin` or `/jv`");
				//console.log("ERROR WITH NO CONNECTION YO FOR AUDIO COMMAND: ")
				return
			}
			if(voiceid == null||voiceid == undefined){
				e.message.reply("You're not even in a voice channel, join a channel and use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
				return
			}else{
				if(voiceid !== botvoiceid){
					e.message.channel.sendMessage("You're not even in the same voice channel as the bot, dropped request.")
					return
				}
				if(!data.args[1]) {
					e.message.channel.sendMessage("No arguments found. **Please see /audiolist for usage**")
					return
				}
				fsExists("./audio/" + data.args[1] + ".mp3", function(err, result) {
					if(result==true){
						stop(connection);
						play("./audio/" + data.args[1] + ".mp3",connection,1);
						e.message.channel.sendMessage("Found Audio file: " + "(*" + data.args[1] + "*)")
						//console.log("[INFO] - Using Audio Command with args: " + data.args[1])
					}else{
						e.message.channel.sendMessage("Audio File: " + "(" + data.args[1] + ") Does not exist.")
					}
				});

			}
			//SendError(e)
		},
		"description": "Plays Music. - Usage: /audio <filename>"
	},
	"cmd": {
	  "command": function(data,e) {
		  var table=[];
		  for (var key in commands) {
			if (commands.hasOwnProperty(key)) {
			  var obj = commands[key];
			  table.push("`"+key+"` >> *"+obj.description+"*")
			}
		  }
		  e.message.reply("I sent you a message with my commands! :)")
		  sendMessageSplit(msg => client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage(msg)), "Bot, Commands - `To use a command enter: / before the commands below`\n"+table.join('\n'));
	  },
	  "description": "All commands!",
	  "authLevel": 0
  },
	"cat": {
		"command": function(data,e) {
			var request = require('request');
			request('http://thecatapi.com/api/images/get?format=xml&results_per_page=1', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var myRegexp = /<url>([^]*?)<\/url>/g;
				var match = myRegexp.exec(body);
				e.message.channel.sendMessage(match[1]);
			  }
			})
		},
		"description": "Gets random cat images.",
		"authLevel": 0
	},
	"rolldice": {
		"command": function(data, e) {
			var answer = Math.floor(Math.random() * (data.args[1] - 0 + 1) + 0);
			e.message.reply("Rolled a `" + answer + "`")
		},
		"description": "Roll a dice! - Usage: /rolldice <number>"
	},
	  "e": {
		"command": function(data,e) {
			var fs = require('fs');
			var channel = e.message.channel;
			if (fs.existsSync("./img/-/"+data.args[1]+".png")) {
				channel.uploadFile(fs.createReadStream("./img/-/"+data.args[1]+".png"));
			}else{
				e.message.channel.sendMessage("Emoji ("+data.args[1]+") does not exist. **/emojilist for usage**")
			}
			if(!data.args[1]){
				e.message.channel.sendMessage("No arguments found, please use: /e <emojiname>")
				return
			}else if(data.args[1]===undefined){
				e.message.channel.sendMessage("No arguments found, please use: /e <emojiname>")
				return
			}
		},
		"description": "Post an emoji in the chat! - Usage: /e <emojiname>",
		"authLevel": 0
	},
	"emojilist": {
		"command": function(data,e) {
			var fs = require('fs');
				fs.readdir("./img/-/", function (err, files) {
				files = files.map(function(file) {
					return file.substring(0, file.indexOf('.'));
				}).join('\n');
				e.message.channel.sendMessage("I sent you a PM With all the Emojis listed!")
				client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage("Bot, Emoji Listing **(Usage for posting: /e <emojiname>)**\n"+"```"+files+"```"))
			});
		},
		"description": "All emojis on server. - Usage: /e <emojiname>",
		"authLevel": 0
	},
	"gi": {
		"command": function(data, e) {
			var createParser = require('search-engine-parser');
			var googleImagesParser = createParser('google-images');
			var tagsAr = [];
			var i = 1;
			for(i=1; i<data["args"].length; i++)
			{
			  var t = data["args"][i];
			  tagsAr.push(t);
			}
			var tags = tagsAr.join(" ");
			// because message cache is limited to 10 messages:
			// (if people spam a lot in the channel)
			// message might be removed from cache and become invalid at the point when google returns the image, so you can't get e.message.channel anymore
			// store channel in a variable so we still have a valid channel instance
			var _channel = e.message.channel;

			googleImagesParser.search(tags, function(err, results){
				  if (!results.map) return;
				results.map(function(result){
					_channel.sendMessage(result);
				});
			});
			if(!(data["args"][1])) {
				e.message.channel.sendMessage("Please enter a search term. **/gi <search_term> (6 words limited.)**")
			}
		},
		"description": "Returns 3 results of google images. - /gi <search_term>",
		"authLevel": 0
	},
	"i": {
		"command": function(data,e) {
			var channel = e.message.channel;
			var fs = require('fs')
			if(!data.args[1]){
				e.message.channel.sendMessage("No arguments found, please use: `/imglist` to see all images.")
				return
			}
			if (fs.existsSync("./img/"+data.args[1]+".png")) {
				//console.log("Found file "+data.args[1]+".png")
				channel.uploadFile(fs.createReadStream("./img/"+data.args[1]+".png"));
			}else if (fs.existsSync("./nsfw/"+data.args[1]+".png")) {
				channel.uploadFile(fs.createReadStream("./nsfw/"+data.args[1]+".png"));
			}else if (fs.existsSync("./img/"+data.args[1]+".gif")) {
				channel.uploadFile(fs.createReadStream("./img/"+data.args[1]+".gif"));
			}else if (fs.existsSync("./nsfw/"+data.args[1]+".gif")) {
				channel.uploadFile(fs.createReadStream("./nsfw/"+data.args[1]+".gif"));
			}else{
				e.message.channel.sendMessage("File ("+data.args[1]+") does not exist. **Use `/imglist` to see all images.**")
				return
			}
		},
		"description": "Post Images.",
		"authLevel": 0
	},
	"imglist": {
		"command": function(data,e) {
			var fs = require('fs');
				fs.readdir("./img", function (err, files) {
				files = files.map(function(file) {
					return file.substring(0, file.indexOf('.'));
				}).join('\n');
				e.message.channel.sendMessage("I sent you a message with all my image files in a list! :)")
				client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage("Bot, Image Listing **(Usage for posting: /i <imagename>**)\n"+"```"+files+"```"+"\n For NSFW Images please use: **/listnsfw**"))
			});
		},
		"description": "All images on server. - Usage: /i <image_name>",
		"authLevel": 0
	},
	"listnsfw": {
		"command": function(data,e) {
			var fs = require('fs');
				fs.readdir("./nsfw", function (err, files) {
				files = files.map(function(file) {
					return file.substring(0, file.indexOf('.'));
				}).join('\n');
				e.message.channel.sendMessage("I sent you a message with all my NSFW image files in a list! :)")
				client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage("Bot, Image Listing **(Usage for posting: /i <imagename>**)\n"+"```"+files+"```"+"\n For NSFW Images please use: **/listnsfw**"))
			});
		},
		"description": "All NSFW images on server. - Usage: /i <image_name>",
		"authLevel": 0
	},
	"botinfo": {
  		"command": function(data,e) {
  			var moment = require('moment')
  			var os = require('os')
  			String.prototype.toHHMMSS = function () {
  				var sec_num = parseInt(this, 10); // don't forget the second param
  				var hours   = Math.floor(sec_num / 3600);
  				var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  				var seconds = sec_num - (hours * 3600) - (minutes * 60);
  				if (hours   < 10) {hours   = "0"+hours;}
  				if (minutes < 10) {minutes = "0"+minutes;}
  				if (seconds < 10) {seconds = "0"+seconds;}
  				var time	= hours+':'+minutes+':'+seconds;
  				return time;
  			}
  			function formatSizeUnits(bytes){
  				if	  (bytes>=1000000000)   {bytes=(bytes/1000000000).toFixed(2)+' GB';}
  				else if (bytes>=1000000)	{bytes=(bytes/1000000).toFixed(2)+' MB';}
  				else if (bytes>=1000)		{bytes=(bytes/1000).toFixed(2)+' KB';}
  				else if (bytes>1)			{bytes=bytes+' bytes';}
  				else if (bytes==1)			{bytes=bytes+' byte';}
  				else						{bytes='0 byte';}
  				return bytes;
  			}
  			var time = process.uptime();
  			var uptime = (time + "").toHHMMSS();
  			e.message.channel.sendMessage(
  				"```fix\nTOTAL MEMORY AVAILABLE: "+formatSizeUnits(os.totalmem())+
  				"\n	 MEMORY BEING USED: "+formatSizeUnits(process.memoryUsage().rss)+
  				"\n				UPTIME: "+uptime+
  				"\n	 VOICE CONNECTIONS: "+client.VoiceConnections.length+
  				"\n	   DISCORD SERVERS: "+client.Guilds.size + "```"
  			);

  		},
  		"description": "Checks the uptime of the bot, also reports misc info.",
  		"authLevel": 0
  	},
  	"imdb": {
  		"command": function(data,e) {
  			var InputTag = [];
  			var i = 1;
  			for(i=1; i<data.args.length; i++)
  			{
  			  var t = data.args[i];
  			  InputTag.push(t);
  			}
  			var movieInput = InputTag.join("+");

  			if(!data.args[1]){
  				e.message.channel.sendMessage("No arguments found, please use /weather <CITY,ST>")
  				return
  			}

  			var request = require('request');
  			request('http://www.omdbapi.com/?t='+ movieInput +'&plot=short&r=json', function (error, response, body) {
  		   		if (!error && response.statusCode == 200) {
  					var movieData = JSON.parse(body);
  					var table=[];
  					for (var key in movieData) {
  					   if (movieData.hasOwnProperty(key)) {
  							if (true==true) {
  								var obj = movieData[key];
  								table.push("__**"+key+"**__: *"+obj+"*")
  							}
  					   }
  					}
  					e.message.channel.sendMessage("__***Movie Result for: "+movieInput+"***__\n"+table.join('\n'))
  				}else{
  					e.message.reply("Sorry about that, there was an error with request to the API, try again.")
  				}
  			})
  		},
  		"description": "Get's a movies information - Usage: /imdb <movie_name>",
  		"authLevel": 0
  	},
  	"join": {
  		"command": function(data,e) {
  			e.message.reply("PM me your invite code and I will join the server! :)")
  			setTimeout(function(){
  				client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage("Send me an invite code here!"))
  			}, 50);

  		},
  		"description": "Joins Invite links - Usage: /join"
  	},
  	"jv": {
  		"command": function(data,e) {
			  var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			  if(data.args[1]){
			  	e.message.reply("Please try again with just `/vjoin`")
			  	return
			  }
			  if(voiceid == null||voiceid == undefined){
			  	e.message.reply("You're not even in a voice channel, join a channel and use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
			  	return
			  }else{
			  	try {
				  voiceid.leave()
		  		voiceid.join().then(info => {
		  		var guildid = info.voiceConnection.guild.id;
		  			voiceconnectionhashmap[guildid] = {
		  				voiceConnection: info.voiceConnection,
		  				stopPlaying: false,
		  				ffmpeg: null
		  			};
		  		});
			  		e.message.channel.sendMessage(":ok_hand: ___**Joining Voice Channel:**___ *"+voiceid+"*")
			  	} catch(e) {
			  		console.log("[ERROR JV]: "+e.stack);
			  	}
			  }
			  //SendError(e)
  		},
  		"description": "Joins voice channel. - Usage: /vjoin"
  	},
  	"kappa123": {
		"command": function(data,e) {
			var channel = e.message.channel;
			e.message.channel.sendMessage("** Kappa 1 2 3 in the chat B O Y S. **")
			channel.uploadFile(fs.createReadStream("./img/kappa123.png"));
		},
		"description": "Posts dank meme Kappa 123",
		"authLevel": 0
	},
	"meme": {
  		"command": function(data,e) {
  			var request = require('request')
			  request('https://api.imgflip.com/get_memes', function (error, response, body) {
				  if (!error && response.statusCode == 200) {
				  var parserRaw = JSON.parse(body);
				  var count = parserRaw.data.memes.length;
				  var random = Math.floor(Math.random() * (count - 1))
				  var parsedData = parserRaw.data.memes[random]
				  e.message.channel.sendMessage("**" + parsedData.name + "** " + parsedData.url + "\n")
				  }
			  })
  		},
  		"description": "Random memes! Usage - /meme"
  	},
	"osu": {
		"command": function(data, e) {
			var InputTag = [];
			var i = 1;
			for(i=1; i<data.args.length; i++)
			{
			  var t = data.args[i];
			  InputTag.push(t);
			}
			var osuInput = InputTag.join("+");
			if(!osuInput){
				e.message.channel.sendMessage("Sorry about that, I need an OSU player to lookup! - Usage: /osu <player>")
				return
			}
			var request = require('request')
			request('https://osu.ppy.sh/api/get_user?k=1a5e7c36c7fa6fe21946f4f0cec6eaf8e0fe182c&u='+osuInput, function (error, response, body) {
				if (!error && response.statusCode == 200) {
				var osu = JSON.parse(body);
				  if (!osu || !osu[0]) return e.message.reply("Sorry about that, there was an error with request to the API, try again.");
				var osuData = osu[0];
				e.message.channel.sendMessage(
					"__**Found player:**__ "+osuData.username+" If the results print `null` It means the user does not have stats\n"+
					"```fix\nPlayer User ID: "+osuData.user_id+"\n"+
					"	 300 Count: "+osuData.count300+"\n"+
					"	 100 Count: "+osuData.count100+"\n"+
					"	  50 count: "+osuData.count50+"\n"+
					"	Play Count: "+osuData.playcount+"\n"+
					"	User Level: "+osuData.level+"\n"+
					"		  Rank: "+osuData.pp_rank+"\n"+
					"   Total Score: "+osuData.total_score+"```"
				);
				}
			})
		},
		"description": "OSU Player searching. - Usage: /osu <player>"
	},
	"lv": {
		"command": function(data,e) {
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			var botvoiceid = client.User.getVoiceChannel(e.message.channel.guild)
			if(!connection) return e.message.channel.sendMessage("I'm not currently in a voice channel.. dropped request.")
			if(voiceid !== botvoiceid) return e.message.channel.sendMessage("You're not even in the same voice channel as the bot, dropped request.")
			stop(connection);
			voiceid.leave();
			e.message.channel.sendMessage(":ok_hand: ___**Attempting to leave my active Voice Channel**___")
			//SendError(e)
		},
		"description": "Leaves voice channel. - Usage: /lv"
	},

	"purge": {
		"command": function(data,e) {
			var member = client.User.memberOf(e.message.channel.guild);
			var c = e.message.channel;
			if(e.message.author.memberOf(e.message.channel.guild.id).roles.find(r => r.name == "TXJBot Admin")){
				if(member.permissionsFor(c).Text.MANAGE_MESSAGES){
					if(!data.args[1]) return e.message.channel.sendMessage("Please enter the amount of messages to remove: Usage - `/purge <1-100>`")
					var c = e.message.channel;
					c.fetchMessages(Number(data.args[1])).then(() => {
						var _messages = c.messages.slice(-data.args[1]);

						var msgcnt = _messages.reduce((n,m) => n += !m.deleted, 0);
						c.sendMessage("```fix\nPurged " + msgcnt + " Messages```");

						for(var msg of _messages) {
							if(msg.deleted) continue;

							var member = client.User.memberOf(e.message.channel.guild);
							if(member && !member.permissionsFor(c).Text.MANAGE_MESSAGES) continue;
							msg.delete();
						}
					});
				}else{
					e.message.channel.sendMessage("```fix\nI don't have permissions to remove messages, sorry. Give the permission *MANAGE_MESSAGES* to the bot in order to use this command.```")
					return
				}
			}else{
				e.message.channel.sendMessage("This command requires the role `TXJBot Admin`, dropped request.")
				return
			}

		},
		"description": "Purges messages - Usage: /purge <1-100>"
	},
	"play": {
		"command": function(data, e) {
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			var botvoiceid = client.User.getVoiceChannel(e.message.channel.guild)
			if(voiceid == null||voiceid == undefined){
				e.message.reply("You're not even in a voice channel, join a channel and use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
				return
			}else{
				if (!connection) return e.message.reply("Not in a voice channel. Use: `/vjoin` or `/jv`")
				if(voiceid !== botvoiceid) return e.message.channel.sendMessage("You're not even in the same voice channel as the bot, dropped request.")
				if (!data.args[1]) return e.message.channel.sendMessage("Sorry, I need something to play! Usage: /play <video_link|audio_stream>")
				if(data.args[1]===undefined||data.args[1]==="") return e.message.channel.sendMessage("No arguments found. **Usage: /play <video_link|audio_stream>**")
				// if(data.args[1]){
				//	 if(data.args[1].indexOf("twitch.tv")>=0) return e.message.channel.sendMessage("Twitch playback is disabled currently.")
				// }

				var audiolink = data.args[1].match(/(mp3|webm|mp4|m4a|flac)$/) != null;
				if(audiolink) {
					stop(connection)
					play(data.args[1], connection);
					return;
				}
				var url = data.args[1];
				var ytdl = child_process.spawn("youtube-dl", ["-f", "bestaudio[ext=webm]/bestaudio", "-g", url]);
				var audiourl = "";
				ytdl.stdout.on('data', data => audiourl += data);
				ytdl.stdout.on('end', () => {
					if(!audiourl) return e.message.channel.sendMessage("Sorry about that, there was an error with your link. Try again.")
					stop(connection)
					play(audiourl.replace(/[\n\r]/g, ""), connection);
					//console.log(audiourl);
				});
			}
			//SendError(e)
		},
		"description": "Plays any audio stream, use this for Youtube or anything else! - Usage: /play <video_link|audio_stream>",
		"authLevel": 0
	},
	"pat": {
		"command": function(data,e) {
			var mentionedUser = e.message.mentions[0]
			if(!data.args[1] || !mentionedUser) return e.message.channel.sendMessage("Please enter a user to pat!, Usage - /pat <mentioned_user>")
			e.message.channel.sendMessage("<@" + e.message.author.id + "> *patted* <@" + mentionedUser.id + "> 's head :3")
		},
		"description": "Pats users heads! - Usage: /pat <mentioned_user>",
		"authLevel": 0
	},
	"stop": {
		"command": function(data,e) {
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			var botvoiceid = client.User.getVoiceChannel(e.message.channel.guild)
			if (!connection){
				e.message.reply("I'm not even in a voice channel, dropped request.")
				//console.log("[INFO]: Nothing playing, user ran stop command", connection);
				return
			}
			if(voiceid !== botvoiceid){
				e.message.channel.sendMessage("You're not even in the same voice channel as the bot, dropped request.")
				return
			}
			if(!voiceid){
				e.message.reply("You're not even in a voice channel, join a channel and Use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
				return
			}else{
				if (connection){
					try{
						stop(connection);
						e.message.reply("ran the command `/stop`")
						//console.log("[STOP COMMAND DEBUG] : ", connection);
					}catch(e) {
						console.log("[ERROR STOP COMMAND]: "+e);
					}
				}
			}
			//SendError(e)
		},
		"description": "Stops the current audio from playing.",
		"authLevel": 0
	},
	"say": {
		"command": function(data,e) {
			var tagsAr = [];
			var i = 1;
			for(i=1; i<data.args.length; i++)
			{
			  var t = data.args[i];
			  tagsAr.push(t);
			}
			var tags = tagsAr.join(" ");
			if(data.args[1] == "/say"){
				e.message.channel.sendMessage("Please don't use this command that way. Thanks :)")
				return
			}else{
				e.message.channel.sendMessage(tags);
			}
		},
		"description": "Send a message as the bot."
	},
	"radio": {
		"command": function(data,e) {
			//SendError(e)
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			var volumeControl = 1;
			if(voiceid == null||voiceid == undefined){
				e.message.reply("You're not even in a voice channel, join a channel and use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
				return
			}else{
				if (!connection){
					return e.message.reply("Not in a voice channel. Use: `/vjoin` or `/jv`");
				}
				if (!data.args[1]){
					return e.message.reply("Sorry, I need a radio station to play! Use: /radiostations");
				}
				if(!data.args[1]){
					e.message.channel.sendMessage("No arguments found. **Usage: /radio <link>**")
					return
				}
				if(data.args[1]==="iloveradio"){
					if(connection){
						stop(connection);
						play("http://stream01.iloveradio.de/iloveradio1.mp3", connection, volumeControl)
						e.message.channel.sendMessage("Playing iLoveRadio - Dutch House Music")
					}
				}else if(data.args[1]==="popularsongs"){
					if(connection){
						stop(connection);
						play("http://209.222.145.140:8001/WAYV_MP3", connection, volumeControl)
						e.message.channel.sendMessage("Playing 'Popular Songs' Radio")
					}
				}else if(data.args[1]==="edmradio"){
					if(connection){
						stop(connection);
						play("http://dw2.hopto.org:9990/dance.mp3", connection, volumeControl)
						e.message.channel.sendMessage("Playing EDM Radio!")
					}
				}else if(data.args[1]==="trapradio"){
					if(connection){ //http://icy3.abacast.com/lkcmradio-kylifmmp3-64
						stop(connection);
						play("http://listen.radionomy.com:80/Ryan-sTrapRadio", connection, volumeControl)
						e.message.channel.sendMessage("Playing Trap Radio!")
					}
				}else if(data.args[1]==="icydance"){
					if(connection){
						stop(connection);
						play("http://icy3.abacast.com/lkcmradio-kylifmmp3-64", connection, volumeControl)
						e.message.channel.sendMessage("Playing KYLI Pulse 96.7 Radio!")
					}
				}else if(data.args[1]==="deepdance"){
					if(connection){
						stop(connection);
						play("http://http.yourmuze.com/pp-furzedeep/h.aac", connection, volumeControl)
						e.message.channel.sendMessage("Playing Deep Dance Radio!")
					}
				}else if(data.args[1]==="monstercat"){
					if(connection){
						//e.message.channel.sendMessage("This channel is currently disabled while I fix the stream.")
						var twitchStreams = require('twitch-get-stream');
						twitchStreams.get("monstercat")
						.then(function(streams) {
							stop(connection);
							play(streams[5].url, connection, volumeControl)
							e.message.channel.sendMessage("Playing Monstercat Radio!")
						});
					}
				}else if(data.args[1]==="vaporware"){
					if(connection){
						stop(connection);
						play("http://vapor.fm:8000/stream", connection, volumeControl)
						e.message.channel.sendMessage("Playing Vapor.fm Radio!")
					}
				}else if(data.args[1]==="hive365"){
					if(connection){
						var request = require('request')
						stop(connection);
						play("http://stream.hive365.co.uk:8088/live", connection, volumeControl)
						request('http://data.hive365.co.uk/stream/info.php', function (error, response, body) {
							if (!error && response.statusCode == 200) {
							var responseRaw = JSON.parse(body)
								e.message.channel.sendMessage("Playing Hive365 Radio! - **Now Playing: " + responseRaw.info.artist_song + "**")
							}
						})
					}
				}else{
					e.message.channel.sendMessage("That's not a valid radio station. Please use /radiostations")
					return
				}
			}
		},
		"description": "Plays a radio stream! - Usage: /radio <station_name>",
		"authLevel": 0
	},
	"reboot": {
		"command": function(data,e) {
				e.message.channel.sendMessage("Rebooted!~")
				setTimeout(function(){
					process.exit(1);
				}, 100);
		},
		"description": "OWNER: Reboots the bot. - Usage: /reboot",
		"authLevel": 0
	},
	"radiostations": {
		"command": function(data,e) {
			e.message.channel.sendMessage("I sent you a message with all my radio stations in a list! :)")
			client.Users.get(e.message.author.id).openDM().then(dm => dm.sendMessage(
				"Bot, Radio Station Listing **(Usage for listening: /radio <station_name>)**\n"+
				"```Radio Stations:\niloveradio\npopularsongs\nedmradio\nmonstercat\nvaporware\ntrapradio\nicydance\ndeepdance```"));
		},
		"description": "List all Radio stations! - Usage: /radio <station_name>",
		"authLevel": 0
	},
	"r34": {
		"command": function(data,e) {
			var request = require('request');
			var parser = require('xml2json');
			var tagsAr = [];
			var i = 1;
			for(i=1; i<data.args.length; i++)
			{
			  var t = data.args[i];
			  tagsAr.push(encodeURIComponent(t));
			}
			var tags = tagsAr.join("+");
			var uri = "http://rule34.xxx/index.php?page=dapi&s=post&limit=31&q=index&tags=" + tags;
			var res = uri;
			//console.log(res)
			request(res, function (error, response, body) {
				if(error){
					e.message.channel.sendMessage("Sorry about that, there was an error with your request. Please try again.")
					return
				}
				if (!error && response.statusCode == 200) {
					var options = {object: true};
					var json = parser.toJson(body, options);
					if (!json || !json.posts || !json.posts.count|| !json.posts.post) return e.message.channel.sendMessage("Sorry, I couldn't find any results for that search term. Please try again")

					//if(json.posts.count == "0") return e.message.channel.sendMessage("Sorry, I couldn't find any results for that search term. Please try again")
					var count = json.posts.post.length;
					var random = Math.floor(Math.random() * (count - 1));
					if (!json.posts.post[random]) return e.message.channel.sendMessage("Sorry, I couldn't find any results for that search term. Please try again");
					e.message.channel.sendMessage("http:" + json.posts.post[random].file_url);
				}
			})
		},
		"description": "Gets random Rule34 images. THIS IS NSFW - Usage: /r34 <search_term>",
		"authLevel": 0
	},
	"slap": {
		"command": function(data,e) {
			var mentionedUser = e.message.mentions[0]
			if(!data.args[1] || !mentionedUser) return e.message.channel.sendMessage("Please enter a user to slap, Usage - /slap <mentioned_user>")
			e.message.channel.sendMessage("<@" + e.message.author.id + "> *slapped* <@" + mentionedUser.id + ">")
		},
		"description": "Slaps users! - Usage: /slap <mentioned_user>",
		"authLevel": 0
	},
	"setavatar": {
		"command": function(data,e) {
				var fs = require('fs')
				if(!data.args[1]) return e.message.channel.sendMessage("No arguments found, please use: `/imglist` to see all images.")

				if (fs.existsSync("./img/"+data.args[1]+".png")) {
					e.message.channel.sendMessage("Found image, setting the bot avatar to: " + data.args[1])
					client.User.edit(auth.password, null, fs.readFileSync("./img/" + data.args[1] + ".png"));
				}else{
					e.message.channel.sendMessage("Image *" + data.args[1] + "* not found.")
					return
				}
		},
		"description": "Sets the bot avatar! - Usage: /setavatar <file>",
		"authLevel": 0
	},
	"setname": {
		"command": function(data,e) {
				var InputTag = [];
				var i = 1;
				for(i=1; i<data.args.length; i++)
				{
				  var t = data.args[i];
				  InputTag.push(t);
				}
				var newUserName = InputTag.join(" ");
				client.User.edit(auth.password, newUserName, client.User.avatar);
		},
		"description": "OWNER: Sets the Bots name - Usage: /setname <name_of_bot>",
		"authLevel": 0
	},
	// "setgame": {
	// 	"command": function(data,e) {
	// 		var InputTag = [];
	// 		var i = 1;
	// 		for(i=1; i<data.args.length; i++)
	// 		{
	// 		  var t = data.args[i];
	// 		  InputTag.push(t);
	// 		}
	// 		var gameUserInput = InputTag.join(" ");
	// 		var game = {name: gameUserInput};
	// 		client.User.setStatus(null, game);
	//
	// 	},
	// 	"description": "Sets the bot game - Usage: /setgame <Name_Of_Game>",
	// 	"authLevel": 0
	// },
	"twitch": {
		"command": function(data,e) {
			var twitchStreams = require('twitch-get-stream');
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			if(voiceid == null||voiceid == undefined){
				e.message.reply("You're not even in a voice channel, join a channel and 'Use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
				return
			}else{
				if (!connection){
					return e.message.reply("Not in a voice channel. Use: `/vjoin` or `/jv`");
				}
				if(!data.args[1]){
					e.message.channel.sendMessage(":frowning: Sorry about that, I need a Twitch Channel to stream - Usage: /twitch <channel_name>")
				}
				twitchStreams.get(data.args[1])
				.then(function(streams) {
					if (connection){
						stop(connection);
						//console.log("[DEBUG TWITCH] : ", connection);
						play(streams[5].url, connection, 1);
						e.message.reply("is playing: **" + info.title + "\n(To stop the song or make the bot leave type /lv or /stop)**")
					}
				});
			}
			//SendError(e)
		},
		"description": "Streams Twitch Channels. - Usage: /twitch <stream_name>"
	},
	"t": {
		"command": function(data,e) {
			var channel = e.message.channel;
			var fs = require('fs')
			var request = require('request')
			request('https://twitchemotes.com/api_cache/v2/global.json', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var parserRaw = JSON.parse(body);
					if(!parserRaw.emotes[data.args[1]]) return
					if(fs.existsSync("./twitchemotes/"+parserRaw.emotes[data.args[1]].image_id+".png")){
						channel.uploadFile(fs.createReadStream("./twitchemotes/" + parserRaw.emotes[data.args[1]].image_id+".png"));
					}else{
						var stream = request("https://static-cdn.jtvnw.net/emoticons/v1/" + parserRaw.emotes[data.args[1]].image_id + "/2.0").pipe(fs.createWriteStream('./twitchemotes/' + parserRaw.emotes[data.args[1]].image_id + '.png'))
						stream.on('finish', function () {
							channel.uploadFile(fs.createReadStream("./twitchemotes/" + parserRaw.emotes[data.args[1]].image_id+".png"));
						});
					}
				}
			})
		},
		"description": "Twitch Emotes! - Usage: /t <Emote>"
	},
	"saytts": {
		"command": function(data,e) {
			var tagsAr = [];
			var i = 1;
			for(i=1; i<data.args.length; i++)
			{
			  var t = data.args[i];
			  tagsAr.push(t);
			}
			var tags = tagsAr.join(" ");
			if(data.args[1] == "/say"){
				e.message.channel.sendMessage("Please don't use this command that way. Thanks :)")
				return
			}else{
				e.message.channel.sendMessage(tags, null, true);
			}
		},
		"description": "Send a message as the bot with text to speech."
	},
	"ud": {
		"command": function(data, e) {
			var InputTag = [];
			var i = 1;
			for(i=1; i<data.args.length; i++)
			{
			  var t = data.args[i];
			  InputTag.push(t);
			}
			var udsearch = InputTag.join(" ");
			var urban = require('urban'),
				searchterm = urban(udsearch);

			searchterm.first(function(body) {
				if(!udsearch){
					e.message.channel.sendMessage("Sorry about that, you need to enter a search term - Usage: /ud <search_term>")
					return
				}
				if(!body){
					e.message.channel.sendMessage("Sorry about that, there was no results found. Please try again.")
					return
				}
				e.message.channel.sendMessage("**Found result for:** *" + body.word + "*\n__**Link:**__ *" + body.permalink + "*\n__**Definition:**__ *" + body.definition + "*\n__**Example:**__ *" + body.example + "*")
			});
		},
		"description": "Urban dictonary searching. - Usage: /ud <search_term>"
	},
	"userinfo": {
		"command": function(data, e) {
			var mentionedUser = e.message.mentions[0]
			if(!mentionedUser){
				e.message.channel.sendMessage(
					"```fix\nREGISTERED AT: "+e.message.author.registeredAt.toUTCString()+
					"\n	 USERNAME: "+e.message.author.username+
					"\n	  USER ID: "+e.message.author.id+
					"\n	   AVATAR: "+e.message.author.avatarURL+
					"\n	   STATUS: "+e.message.author.status.toUpperCase()+
					"\n	  PLAYING: "+e.message.author.gameName+"```"
				);
			}else{
				e.message.channel.sendMessage(
					"```fix\nREGISTERED AT: "+mentionedUser.registeredAt.toUTCString()+
					"\n	 USERNAME: "+mentionedUser.username+
					"\n	  USER ID: "+mentionedUser.id+
					"\n	   AVATAR: "+mentionedUser.avatarURL+
					"\n	   STATUS: "+mentionedUser.status.toUpperCase()+
					"\n	  PLAYING: "+mentionedUser.gameName+"```"
				);
			}
		},
		"description": "Pulls user info for yourself or a mentioned user (OPTIONAL) - Usage: /userinfo <mentioned_user>"
	},
	"vjoin": {
		"command": function(data,e) {
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			if(data.args[1]){
				e.message.reply("Please try again with just `/vjoin`")
				return
			}
			if(voiceid == null||voiceid == undefined){
				e.message.reply("You're not even in a voice channel, join a channel and 'Use: `/vjoin` or `/jv` to have the bot join a voice channel\nDropped request.")
				return
			}else{
				try {
					voiceid.join().then(info => {
					var guildid = info.voiceConnection.guild.id;
						voiceconnectionhashmap[guildid] = {
							voiceConnection: info.voiceConnection,
							stopPlaying: false,
							ffmpeg: null
						};
					});
					e.message.channel.sendMessage(":ok_hand: ___**Joining Voice Channel:**___ *"+voiceid+"*")
				} catch(e) {
					console.log("[ERROR VJOIN]: "+e.stack);
				}
			}
			//SendError(e)
		},
		"description": "Joins voice channel. - Usage: /vjoin"
	},
	"vleave": {
		"command": function(data,e) {
			var connection = voiceconnectionhashmap[e.message.channel.guild.id];
			var voiceid = e.message.author.getVoiceChannel(e.message.channel.guild)
			var botvoiceid = client.User.getVoiceChannel(e.message.channel.guild)
			if(!connection){
				e.message.channel.sendMessage("I'm not currently in a voice channel.. dropped request.")
				return
			}
			if(voiceid !== botvoiceid){
				e.message.channel.sendMessage("You're not even in the same voice channel as the bot, dropped request.")
				return
			}
			voiceid.leave();
			e.message.channel.sendMessage(":ok_hand: ___**Attempting to leave my active Voice Channel**___")
			//SendError(e)
		},
		"description": "Leaves voice channel. - Usage: /vleave or /lv"
	},
	"weather": {
		"command": function(data,e) {
			if(!data.args[1]){
				e.message.channel.sendMessage("No arguments found, Please use /weather <CITY,ST>")
				return
			}
			var request = require('request');
			request('http://api.openweathermap.org/data/2.5/weather?q='+ data.args[1] +'&apikey=9cd76597c48f53c329fabe0396cd371e&units=imperial', function (error, response, body) {
				if (!error && response.statusCode == 200) {
				var weatherData = JSON.parse(body);
					if(weatherData.cod == "404"){
						e.message.channel.sendMessage("I'm sorry, there was an error with your request.")
						return
					}
					e.message.channel.sendMessage(
						"__***Weather for: "+weatherData.name+"***__\n"+
						"Current Temperature: **"+weatherData.main.temp+"** °F\n"+
						"High Temp: **"+weatherData.main.temp_max+"** °F\n"+
						"Low Temp: **"+weatherData.main.temp_min+"** °F\n"+
						"Winds: **"+weatherData.wind.speed+"** MP/H\n"+
						"Humidity: **"+weatherData.main.humidity+"%**\n"+
						"Clouds :cloud: : **"+weatherData.clouds.all+"%**\n"
					);
				}
			})
		},
		"description": "Gets weather for an area - Usage: /weather <CITY,ST> or <CITY>",
		"authLevel": 0
	},
	"8ball": {
		"command": function(data, e) {
			var input = data.args[1];
			var answer = Math.floor(Math.random() * (5 - 0 + 1) + 0);
			if(!data.args[1]){
				e.message.channel.sendMessage("No arguments found, please use: /8ball <question to ask>")
				return
			}
			if(answer === 1) {
			e.message.reply("Yes");}
			else if(answer === 2) {
			e.message.reply("No");}
			else if(answer === 3) {
			e.message.reply("Maybe");}
			else if(answer === 4) {
			e.message.reply("Ask again later");}
			else if(answer === 5) {
			e.message.reply("Definitely");}
			else {
			e.message.reply("How should I know?");}
		},
		"description": "Magic 8-Ball Command - Usage: /8ball <question to ask>",
		"authLevel": 3
	}
}
client.Dispatcher.on(Discordie.Events.MESSAGE_CREATE, (e) => {

	//Command check for PMs NEW METHOD
	if(e.message.isPrivate){
		if(e.message.author.id == "113877103514091522"){
			//console.log("BOT PM FOUND IGNORING")
		}else{
			if(
				e.message.isPrivate &&
				e.message.content.indexOf("/lv") >= 0 ||
				e.message.content.indexOf("/jv") >= 0 ||
				e.message.content.indexOf("/vjoin") >= 0 ||
				e.message.content.indexOf("/vleave") >= 0 ||
				e.message.content.indexOf("/audio") >= 0 ||
				e.message.content.indexOf("/play") >= 0 ||
				e.message.content.indexOf("/stop") >= 0 ||
				e.message.content.indexOf("/info") >= 0 ||
				e.message.content.indexOf("/twitch") >= 0 ||
				e.message.content.indexOf("/pingowner") >= 0 ||
				e.message.content.indexOf("/block") >= 0 ||
				e.message.content.indexOf("/ddos") >= 0 ||
				e.message.content.indexOf("/purge") >= 0 ||
				e.message.content.indexOf("/radio") >= 0)
			{
				e.message.channel.sendMessage("Sorry, you cannot use that command in PMs")
				return
			}
		}
	}
	//invite manager for Carbon
	if(e.message.isPrivate && e.message.content.indexOf("discord.gg") >= 0){
		var code = /https?:\/\/discord\.gg\/([A-Za-z0-9-]+)\/?/.exec(e.message.content)[1];
		client.Invites.resolve(code).then(function(value) {
			if(client.Guilds.find(g => g.name == value.guild.name) >= 1){
				e.message.channel.sendMessage("I'm already in that server! :) 'If the bot is not in the server already, rename your server to something else.'")
				return
			}else{
				client.Invites.accept(code)
				e.message.channel.sendMessage("Found invite!, joining server! :)")
			}
		}, function(reason) {
			e.message.channel.sendMessage("**The bot is banned from this server.**")
		});
	}

	var messageSplit = e.message.content.split(" ");
	if (e.message.content.slice(0,1)=="/") {
		if (commands[messageSplit[0].slice(1)]) {
			console.log("[COMMAND]: User: " + e.message.author.username + " | User ID: "  + e.message.author.id + " Command Used: " + e.message.content.slice(1))
			try {
				commands[messageSplit[0].slice(1)]["command"]({"args":messageSplit,"userid":e.message.author.id}, e)
			} catch(e) {
				var request = require('request')
				console.log(e)
			}
		}
	}
});

client.Dispatcher.on(Discordie.Events.VOICE_CONNECTED, (data) => {
	if(client.VoiceConnections.length <= 0) {
		return
	}
	//console.log("VOICE_CONNECTED ON GUILD")
});

function getConverterDCA(args, options) {
	var binaries = [
		'dca',
		'/root/bin/dca',
		'/bin/dca',
		'dca.exe'
	];

	var paths = process.env.PATH.split(path.delimiter).concat([".", ""]);

	for (var name of binaries) {
		for (var p of paths) {
			var binary = p + path.sep + name;
			if (!fs.existsSync(binary)) continue;
			return child_process.spawn(name, args, options);
		}
	}
	return null;
}
function stop(voiceConnectionInfo) {
	try {
		if(!voiceConnectionInfo||voiceConnectionInfo == undefined||voiceConnectionInfo == null){
			//console.log("Error found with no defined voice connection info")
			return
		}
		voiceConnectionInfo.stopPlaying = true;
		if (!voiceConnectionInfo.ffmpeg){
			//console.log("No found DCA instance on guild")
			return
		}
		if (voiceConnectionInfo.ffmpeg) voiceConnectionInfo.ffmpeg.kill();
		voiceConnectionInfo.ffmpeg = null;
	} catch(e) {
		console.log("[ERROR STOP FUNCTION]: "+e);
	}
}
function playffmpeg(audioURL, voiceConnectionInfo, volume) {
	if(!voiceConnectionInfo){
		//console.log("NO INFO")
	}
	voiceConnectionInfo.stopPlaying = false;
	var sampleRate = 48000;
	var bitDepth = 16;
	var channels = 2;

	//if (voiceConnectionInfo.ffmpeg) voiceConnectionInfo.ffmpeg.kill();
	var ffmpeg = getConverter([
		"-re",
		"-i", audioURL,
		"-f", "s16le",
		"-ar", sampleRate,
		'-af', 'volume=' + 1,
		"-ac", channels,
		"-"
	], {stdio: ['pipe', 'pipe', 'ignore']});
	if (!ffmpeg) return //console.log("ffmpeg/avconv not found");

  	voiceConnectionInfo.ffmpeg = ffmpeg;

	var _ffmpeg = ffmpeg;
	var ff = ffmpeg.stdout;

	// note: discordie encoder does resampling if rate != 48000
	//
	var options = {
		frameDuration: 60,
		sampleRate: sampleRate,
		channels: channels,
		float: false,
		multiThreadedVoice: true,
		engine: "native",
		bitrate: 64000,
		volume: 100
	};

	const frameDuration = 60;

	var readSize =
		sampleRate / 1000 *
		options.frameDuration *
		bitDepth / 8 *
		channels;

	ff.once('readable', function() {
		if(!client.VoiceConnections.length) {
			return //console.log("Voice not connected");
		}
	  	if (!voiceConnectionInfo) {
		  return //console.log("DAMAGED STREAM");
		}
		var voiceConnection = voiceConnectionInfo.voiceConnection;

		// one encoder per voice connection
		var encoder = voiceConnection.getEncoder(options);
			voiceConnectionInfo.encoder = encoder;
		const needBuffer = () => encoder.onNeedBuffer();
			// var packets = 0;
			// function encoderCount() {
			//	 packets += 1;
			// }
			encoder.onNeedBuffer = function() {
				//encoderCount()
				//console.log(packets)
				var encoderCalled = 0
				var chunk = ff.read(readSize);

				if (_ffmpeg.killed) return;
				if (voiceConnectionInfo.stopPlaying){
					//console.log("STOP PLAYING FOUND TRUE, STOPPING CODE")
					stop(voiceConnectionInfo);
					return
				}

				// delay the packet if no data buffered
				if (!chunk) return setTimeout(needBuffer, options.frameDuration);

				var sampleCount = readSize / channels / (bitDepth / 8);
				encoder.enqueue(chunk, sampleCount);
			};
			needBuffer();

	});
	ff.once('end', () => {
		voiceConnectionInfo.stopPlaying = true;
	});
}
function play(audioURL, voiceConnectionInfo, volume) {
	//console.log("STARTING NOW " + audioURL)
	if(!voiceConnectionInfo){
		//console.log("NO INFO")
		return
	}
	voiceConnectionInfo.stopPlaying = false;
	var sampleRate = 48000;
	var bitDepth = 16;
	var channels = 2;

	//if (ffmpeg) ffmpeg.kill();
	var dca = getConverterDCA([
		"-as", "2880",
		"-i", audioURL
	], {stdio: ['pipe', 'pipe', 'ignore']});
	if (!dca) return //console.log("dcav not found");

  	voiceConnectionInfo.ffmpeg = dca;

	var _dca = dca;
	var opusstream = dca.stdout;

	const frameDuration = 60;
	const samplesPerFrame = 48000 * frameDuration / 1000;
	var options = {
		frameDuration: frameDuration,
		proxy: true
	};

	opusstream.once('readable', function() {
		if(!client.VoiceConnections.length) {
			return //console.log("Voice not connected");
		}
	  	if (!voiceConnectionInfo) {
		  return //console.log("DAMAGED STREAM");
		}
		var voiceConnection = voiceConnectionInfo.voiceConnection;

		// one encoder per voice connection
		var encoder = voiceConnection.getEncoder(options);
			voiceConnectionInfo.encoder = encoder;
		const needBuffer = () => encoder.onNeedBuffer();
			// var packets = 0;
			// function encoderCount() {
			//	 packets += 1;
			// }
			if(!encoder){
				console.log("broken stream")
				stop(voiceConnectionInfo)
				voiceConnectionInfo.stopPlaying = true;
				return
			}
			encoder.onNeedBuffer = function() {
				//encoderCount()
				//console.log(packets)
				var encoderCalled = 0
				var chunksize = opusstream.read(2);

				if (_dca.killed) return;
				if (voiceConnectionInfo.stopPlaying){
					//console.log("STOP PLAYING FOUND TRUE, STOPPING CODE")
					stop(voiceConnectionInfo);
					return
				}

				// delay the packet if no data buffered
				if (!chunksize) return setTimeout(needBuffer, options.frameDuration);

				var chunk = opusstream.read(chunksize.readUInt16LE(0));
				if (!chunk) return setTimeout(needBuffer, options.frameDuration);

				encoder.enqueue(chunk, samplesPerFrame);
			};
			needBuffer();

	});
	opusstream.once('end', () => {
		//console.log("DCA ENDED")
		//var stopPlaying = true;
		voiceConnectionInfo.stopPlaying = true;
		//if (voiceConnection.stopPlaying) return;
		//setTimeout(play, 100, voiceConnectionInfo);
	});
}
function sendMessageSplit(fn, s) {
	if (s.length < 2000) return fn(s);

	return new Promise((rs, rj) => {
	  const lines = s.split("\n");

	  var chunks = [];
	  var chunk = "";
	  lines.forEach(line => {
		chunk += line + "\n";
		if (chunk.length + line.length + 1 >= 2000) {
		  chunks.push(chunk);
		  chunk = "";
		  return;
		}
	  });
	  if (chunk) chunks.push(chunk);

	  chunks.reduce(
		(cur, next) => cur.then(() => fn(next)),
		Promise.resolve()
	  ).then(rs).catch(rj);
	});
}
function SendError(e){
	e.message.channel.uploadFile(fs.createReadStream("./discord.png"), null, "Voice functionality is currently disabled and in the works of converting to the new Discord API, please standby while I convert things, thanks yo.");
}
