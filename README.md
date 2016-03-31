# TXJ Bot Source Code

##Installation
`npm install JayEffTree/txjbot_source`

`ffmpeg` is required.


##Configuration:
- TXJ Bot requires a config file (included) formatted like below.
```
module.exports = {
	email: "email@exmple.com",
	password: "password"
};
```
- Adding Images to the bot: `files must be in the format: xxxx.png \ xxxx.gif` in the `img` folder
- For adding images to the NSFW folder, use png formats like so `xxx.png` file cannot contain spaces.

##Commands
Commands are listed on `/cmd`

If the labels are not correct edit the `"description"` in the commands object (example: )
```javascript
"kappa123": {
  "command": function(data,e) {
    //command here
  },
"description": "Posts dank meme Kappa 123",
"authLevel": 0
}
