# BankerBot

A bot used to keep track of points between discord users. They're called cookies (Though you can spend a little time and replace wherever it says cookie with what you want.)  
  
To run you'll need nodejs https://nodejs.org/  
Open up a terminal in the directory of the bot and type `npm install`  
If you don't know how to open a terminal in the directory google it.  
It will take a bit and install the module to connect to discord.  
goto https://discordapp.com/developers/applications/me (make sure you're logged in).  
Click the button to create a new app then name it, click the button to turn it into a bot and choose accept.  
In config.json set the "bot_token" value (the text inside the "" next to it) to your token. (There's a button to reveal it)  
  
Next goto https://discordapp.com/oauth2/authorize?client_id=<client id>scope=bot
replace <client id> in the link with the client id it shows on the bot page. Then invite it to your server.  
  
# Usage:  
b!add [amount] @User @User1 @User2 @User3 @User4  
Minimum of one user. Gives each user the [amount]. replace [amount] with a number.  
b!subtract [amount] @User @User1 @User2 @User3 @User4  
Minimum of one user. Subtracts from each user the [amount]. replace [amount] with a number.  
b!check @User1 @User2 @User3 @User4  
Minimum of one user. It tells whoever uses the command that persons point amount.