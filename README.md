# TXJ Bot Source Code

##Configuration
TXJ Bot requires a config file (included) formatted like below.
```
module.exports = {
	email: "email@exmple.com",
	password: "password"
};
```

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
