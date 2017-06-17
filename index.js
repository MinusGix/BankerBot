/* jshint esversion:6*/
//https://discordapp.com/oauth2/authorize?client_id=<client id>scope=bot


var Discord = require("discord.js"),
    fs = require('fs'),
    Config = loadJSON(__dirname + '/JSON/config.json'),
    Points = loadJSON(__dirname + '/JSON/points.json'),
    Client = new Discord.Client(),
    Commands = {},
    Dates = {};


function loadJSON(dir) {
    try {
        return JSON.parse(fs.readFileSync(dir, 'utf8'));
    } catch (err) {
        console.log(err.stack);
    }
}

function writeJSON(dir, obj) {
    try {
        fs.writeFileSync(dir, JSON.stringify(obj), 'utf8');
    } catch (err) {
        console.log(err.stack);
    }
}


Client.on('ready', () => {
    console.log(`Logged in as ${Client.user.username}!`);
    Client.user.setGame("Keeping track of the cookies.");
});

Client.on('message', msg => {
    var args = {
        text: msg.content,
        nick: msg.author.username,
        send: msg.channel.send.bind(msg.channel),
        reply: msg.reply.bind(msg),
        msg: msg
    };
    var currentDate = new Date(),
        id = args.msg.author.id;

    if ((currentDate - Dates[id]) >= 60000 || !Dates[id]) { // milliseconds
        Dates[id] = currentDate;
        if (Points[id] === undefined) {
            Points[id] = 0;
        }
        Points[id] += 0.5;
    }

    runCommand(args);
});

function runCommand(args, n) {
    if (args.msg.author.id + "" === Client.user.id) {
        return;
    }

    let prefix = Config.prefix;

    if (args.text.startsWith(prefix)) {
        var params = args.text.replace(prefix, '').split(' ');
        args.cmd = params[0].toLowerCase();
        args.prefix = prefix;
        args.params = params.slice(1);
        args.string = args.params.join(' ');
        args.stringLower = args.string.toLowerCase();

        if (Commands.hasOwnProperty('cmd_' + args.cmd)) {
            Commands['cmd_' + args.cmd].func(args);
        } else {
            args.reply(`that\'s not a command. Use ${Config.prefix}help`);
        }
    }
}

function addCommand(name, help, func, hidden) {
    if (typeof(help) === 'function') {
        func = help;
        help = false;
    }
    Commands['cmd_' + name.toLowerCase()] = {
        help: help || 'Sorry, but there is no help for this command yet.',
        func: func || function() {},
        hidden: hidden || false
    };
}

addCommand('help', 'Usage:\n%prefix%%cmdname%\n- Shows the list of commands.\n%prefix%%cmdname% name_of_command_that_you_want_help_with', function(args) {
    if (Commands.hasOwnProperty('cmd_' + args.stringLower)) {
        args.send(
            Commands['cmd_' + args.stringLower].help
            .replace(/\%prefix\%/gi, args.prefix)
            .replace(/\%cmdname\%/gi, args.stringLower)
        );
    } else {
        var text = '',
            first = true;

        for (var i in Commands) {
            if (first) {
                first = false;
            } else {
                text += ', ';
            }
            text += args.prefix + i.replace('cmd_', '');
        }
        args.send('Help:\n' + text);
    }
});

addCommand('check', 'Usage:\n%prefix%%cmdname% @<user, blank for yourself>', function(args) {
    var mentions = args.msg.mentions,
        roles = mentions.roles.array(),
        users = mentions.users.array();

    if (typeof(args.params[0]) === 'string') {
        if (args.params[0].toLowerCase() === 'roles' || args.params[0].toLowerCase() === 'role') {
            let allowed = false;
            args.msg.member.roles.array().forEach(function(role) {
                if (role.name.toLowerCase() === Config.editRole.toLowerCase()) {
                    allowed = true;
                    return;
                }
            });
            if (allowed) {
                roles = args.params.slice(1);

                let guildRoles = args.msg.guild.roles.array(),
                    doneAtLeastOnce = false;
                let text = '**Cookies**:\n';

                for (let i = 0; i < guildRoles.length; i++) {
                    for (let o = 0; o < roles.length; o++) {
                        if (guildRoles[i].name.toLowerCase() === roles[o].toLowerCase()) {
                            let members = guildRoles[i].members.array();
                            doneAtLeastOnce = true;
                            for (let z = 0; z < members.length; z++) {
                                text += `${members[z].toString()} has ${Points[members[z].id] || 0} Cookie(s).\n`;
                            }
                        }
                    }
                }

                writeJSON(__dirname + '/JSON/points.json', Points);

                if (doneAtLeastOnce) {
                    return args.reply(text);
                } else {
                    return args.reply(`Didn't find those roles, or they didn't have any users.`);
                }
            }
        }
    }

    if (mentions.everyone) {
        return args.reply("Sorry but I don't give out Cookies right now, because that'd be a long list.");
    }
    if (roles.length !== 0) {
        let allowed = false;
        args.msg.member.roles.array().forEach(function(role) {
            if (role.name.toLowerCase() === Config.editRole.toLowerCase()) {
                allowed = true;
                return;
            }
        });
        if (allowed) {
            let text = '**Cookies**:\n';

            for (let o = 0; o < roles.length; o++) {
                let members = roles[o].members.array();
                for (let i = 0; i < members.length; i++) {
                    text += `${members[i].toString()} has ${Points[members[i].id] || 0} Cookie(s).\n`;
                }
            }
            return args.reply(text);
        } else {
            return args.reply("Sorry but only bankers can see all of roles users cookies.");
        }
    }
    if (users.length !== 0) {
        let text = '**Cookies**:\n';

        for (let i = 0; i < users.length; i++) {
            text += `${users[i].toString()} has ${Points[users[i].id] || 0} Cookie(s).\n`;
        }
        return args.reply(text);
    }

    args.reply(`You have ${Points[args.msg.author.id] || 0} Cookie(s)!`);
});

addCommand('add', 'Usage:\n%prefix%%cmdname% <number> @<user or roles>\nAdds <number> amount of Cookies to those users', function(args) {
    var allowed = false;
    args.msg.member.roles.array().forEach(function(role) {
        if (role.name.toLowerCase() === Config.editRole.toLowerCase()) {
            allowed = true;
            return;
        }
    });

    if (allowed) {
        let num = Number(args.params[0]);

        if (isNaN(num) || num === Infinity || num === -Infinity) {
            return args.reply('Sorry, but that is not a number at all :(');
        }

        let mentions = args.msg.mentions,
            roles = mentions.roles.array(),
            users = mentions.users.array();

        if (typeof(args.params[1]) === 'string') {
            if (args.params[1].toLowerCase() === 'roles' || args.params[1].toLowerCase() === 'role') {
                roles = args.params.slice(2);

                let guildRoles = args.msg.guild.roles.array(),
                    doneAtLeastOnce = false;

                for (let i = 0; i < guildRoles.length; i++) {
                    for (let o = 0; o < roles.length; o++) {
                        if (guildRoles[i].name.toLowerCase() === roles[o].toLowerCase()) {
                            let members = guildRoles[i].members.array();
                            doneAtLeastOnce = true;
                            for (let z = 0; z < members.length; z++) {
                                let id = members[z].id;
                                if (typeof(Points[id]) !== 'number') {
                                    Points[id] = num;
                                } else {
                                    Points[id] += num;
                                }
                            }
                        }
                    }
                }

                writeJSON(__dirname + '/JSON/points.json', Points);

                if (doneAtLeastOnce) {
                    return args.reply(`Added ${num} Cookie(s) to those user(s) that have those role(s)!`);
                } else {
                    return args.reply(`Didn't find those roles, or they didn't have any users.`);
                }

            }
        }
        if (mentions.everyone || args.params[1] === 'everyone') {
            //if everyone was mentioned
            let members = args.msg.guild.members.array();
            args.send('This might take a bit...');
            for (let i = 0; i < members.length; i++) {
                let id = members[i].id;

                if (typeof(Points[id]) !== 'number') {
                    Points[id] = num;
                } else {
                    Points[id] += num;
                }
            }
            writeJSON(__dirname + '/JSON/points.json', Points);
            return args.reply(`Added ${num} Cookie(s) to those user(s)!`);
        }
        if (roles.length !== 0) {
            //if a role/roles were mentioned
            for (let o = 0; o < roles.length; o++) {
                let members = roles[o].members.array();
                for (let i = 0; i < members.length; i++) {
                    let id = members[i].id;
                    if (typeof(Points[id]) !== 'number') {
                        Points[id] = num;
                    } else {
                        Points[id] += num;
                    }
                }
            }
            writeJSON(__dirname + '/JSON/points.json', Points);
            return args.reply(`Added ${num} Cookie(s) to those user(s) that have those role(s)!`);
        }
        if (users.length !== 0) {
            //if a user/users were mentioned
            for (let i = 0; i < users.length; i++) {
                let id = users[i].id;

                if (typeof(Points[id]) !== 'number') {
                    Points[id] = num;
                } else {
                    Points[id] += num;
                }
            }
            writeJSON(__dirname + '/JSON/points.json', Points);
            return args.reply(`Added ${num} Cookie(s) to those user(s)!`);
        }
        return args.reply("That isn't a user, or a role!");
    }
    return args.reply("Sorry, but you aren't allowed to do that. Ask a Banker to do it.");
});

addCommand('subtract', 'Usage:\n%prefix%%cmdname% <number> @<user or roles>\nSubtracts <number> amount of Cookies to those users', function(args) {
    var allowed = false;
    args.msg.member.roles.array().forEach(function(role) {
        if (role.name.toLowerCase() === Config.editRole.toLowerCase()) {
            allowed = true;
            return;
        }
    });

    if (allowed) {
        let num = Number(args.params[0]);

        if (isNaN(num) || num === Infinity || num === -Infinity) {
            return args.reply('Sorry, but that is not a number at all :(');
        }

        let mentions = args.msg.mentions,
            roles = mentions.roles.array(),
            users = mentions.users.array();

        if (typeof(args.params[1]) === 'string') {
            if (args.params[1].toLowerCase() === 'roles' || args.params[1].toLowerCase() === 'role') {
                roles = args.params.slice(2);

                let guildRoles = args.msg.guild.roles.array(),
                    doneAtLeastOnce = false;

                for (let i = 0; i < guildRoles.length; i++) {
                    for (let o = 0; o < roles.length; o++) {
                        if (guildRoles[i].name.toLowerCase() === roles[o].toLowerCase()) {
                            let members = guildRoles[i].members.array();
                            doneAtLeastOnce = true;
                            for (let z = 0; z < members.length; z++) {
                                let id = members[z].id;
                                if (typeof(Points[id]) !== 'number') {
                                    Points[id] = -num;
                                } else {
                                    Points[id] -= num;
                                }
                            }
                        }
                    }
                }

                writeJSON(__dirname + '/JSON/points.json', Points);

                if (doneAtLeastOnce) {
                    return args.reply(`Subtracted ${num} Cookie(s) to those user(s) that have those role(s)!`);
                } else {
                    return args.reply(`Didn't find those roles, or they didn't have any users.`);
                }

            }
        }
        if (mentions.everyone || args.params[1] === 'everyone') {
            //if everyone was mentioned
            let members = args.msg.guild.members.array();
            args.send('This might take a bit...');
            for (let i = 0; i < members.length; i++) {
                let id = members[i].id;

                if (typeof(Points[id]) !== 'number') {
                    Points[id] = -num;
                } else {
                    Points[id] -= num;
                }
            }
            writeJSON(__dirname + '/JSON/points.json', Points);
            return args.reply(`Subtracted ${num} Cookie(s) to those user(s)!`);
        }
        if (roles.length !== 0) {
            //if a role/roles were mentioned
            for (let o = 0; o < roles.length; o++) {
                let members = roles[o].members.array();
                for (let i = 0; i < members.length; i++) {
                    let id = members[i].id;
                    if (typeof(Points[id]) !== 'number') {
                        Points[id] = -num;
                    } else {
                        Points[id] -= num;
                    }
                }
            }
            writeJSON(__dirname + '/JSON/points.json', Points);
            return args.reply(`Subtracted ${num} Cookie(s) to those user(s) that have those role(s)!`);
        }
        if (users.length !== 0) {
            //if a user/users were mentioned
            for (let i = 0; i < users.length; i++) {
                let id = users[i].id;

                if (typeof(Points[id]) !== 'number') {
                    Points[id] = -num;
                } else {
                    Points[id] -= num;
                }
            }
            writeJSON(__dirname + '/JSON/points.json', Points);
            return args.reply(`Subtracted ${num} Cookie(s) to those user(s)!`);
        }
        return args.reply("That isn't a user, or a role!");
    }
    return args.reply("Sorry, but you aren't allowed to do that. Ask a Banker to do it.");
});

addCommand('nya', 'Usage:\n%prefix%%cmdname%', function(args){
	return args.reply('https://cdn.discordapp.com/attachments/234696507352154112/317349793926217728/imgres.gif');
});

addCommand('roll', 'Usage:\n%prefix%%cmdname%\nRolls a d20\n%prefix%%cmdname% <max>\n gets a random number between 1 and <max>', function(args){
	return args.reply(Math.floor(Math.random()*(!args.params[0] ? 20:Number(args.params[0]))+1));
});

/*addCommand('give', 'Usage:\n%prefix%%cmdname% amount <user>', function(args) {
    let num = Number(args.params[0]);

    if (isNaN(num)) {
        return args.reply("Please give a number of Cookies to give to a user.");
    }

    var users = args.msg.mentions.users.array();

    if (users.length === 0) {
        return args.reply("Please give a user to give Cookies to.");
    }

    if (users.length > 1) {
        return args.reply("Please only give one user to give Cookies to.");
    }

    if (users.length === 1) {

    } else {
        return args.reply("")
    }
});*/

Client.login(Config.bot_token);