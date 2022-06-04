#!/usr/bin/env node
"use strict";
require("dotenv").config();

const Discord = require("discord.js");
const chalk = require("chalk");
const moment = require("moment");
const { BOT_TOKEN, VERIFICATION_CHANNEL, VERIFIED_ROLE, VERIFICATION_MESSAGE } = process.env;
const ERROR_MESSAGE_TIMEOUT = parseInt(process.env.ERROR_MESSAGE_TIMEOUT);
const SUCCESS_MESSAGE_TIMEOUT = parseInt(process.env.SUCCESS_MESSAGE_TIMEOUT);

const client = new Discord.Client({
  disableEveryone: true,
  intents: 513,
  allowedMentions: { parse : ['users'] },
});

setTimeout(() => {
    const version = Number(process.version.split('.')[0].replace('v', ''));
    if (version < 16) return console.log('\n\nPlease upgrade to Node v16 or higher\nPlease upgrade to Node v16 or higher\nPlease upgrade to Node v16 or higher\n\n');
}, 8000);

client.once("ready", () => {
  console.log(chalk.greenBright("[READY]"), `Logged in as ${client.user.tag} (${client.user.id}) at ${moment().format("DD MMMM YYYY, hh:mm:ss")}`);
});

client.on("messageCreate", message => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.content === VERIFICATION_MESSAGE && message.channel.id === VERIFICATION_CHANNEL) {
    if (!message.channel.permissionsFor(message.guild.me).serialize().SEND_MESSAGES) return console.error("The bot doesn't have the permission to send messages.\nRequired permission: SEND_MESSAGES");
    if (!message.channel.permissionsFor(message.guild.me).serialize().ADD_REACTIONS) {
      console.error("The bot doesn't have the permission to add reactions.\nRequired permission: `ADD_REACTIONS`");
      message.channel.send({ content: "The bot doesn't have the permission to add reactions.\nRequired permission: `ADD_REACTIONS`" })
        .then(m => setTimeout(() => m.delete(), ERROR_MESSAGE_TIMEOUT));
      return;
    }
    if (!message.channel.permissionsFor(message.guild.me).serialize().MANAGE_MESSAGES) {
      console.error("The bot doesn't have the permission to delete messages.\nRequired permission: `MANAGE_MESSAGES`");
      message.channel.send({ content: "The bot doesn't have the permission to delete messages.\nRequired permission: `MANAGE_MESSAGES`" })
        .then(m => setTimeout(() => m.delete(), ERROR_MESSAGE_TIMEOUT));
      return;
    }
    const messageRole = message.guild.roles.cache.get(VERIFIED_ROLE) ||
	message.guild.roles.cache.find(role => role.name === VERIFIED_ROLE);
    if (messageRole == null) return console.error('Role ' + VERIFIED_ROLE + ' not found.');
    if (!message.guild.me.permissions.has("MANAGE_ROLES")) {
      message.channel.send({ content: "The bot doesn't have the permission required to assign roles.\nRequired permission: `MANAGE_ROLES`" })
        .then(m => setTimeout(() => m.delete(), ERROR_MESSAGE_TIMEOUT));
      return;
    }
    if (message.guild.me.roles.highest.comparePositionTo(messageRole) < 1) {
      message.channel.send({ content: "The position of this role is higher than the bot's highest role, it cannot be assigned by the bot." })
        .then(m => setTimeout(() => m.delete(), ERROR_MESSAGE_TIMEOUT));
      return;
    }
    if (messageRole.managed == true) {
      message.channel.send({ content: "This is an auto managed role, it cannot be assigned." })
        .then(m => setTimeout(() => m.delete(), ERROR_MESSAGE_TIMEOUT));
      return;
    }
    if (message.member.roles.cache.has(messageRole.id)) return;
    message.react("✅");
    message.member.roles.add(messageRole)
      .then(() => setTimeout(() => message.delete() ,SUCCESS_MESSAGE_TIMEOUT))
      .catch(error => {
      console.error(error);
      message.channel.send({ content: error.stack })
        .then(m => setTimeout(() => m.delete(), ERROR_MESSAGE_TIMEOUT));
    });
  }
});

client.login(BOT_TOKEN);

process.on('unhandledRejection', (err) => { 
    console.log(`\nFATAL ERROR: \n\n`, err.stack)
});
