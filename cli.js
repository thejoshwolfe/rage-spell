#!/usr/bin/env node

var gameModule = require(process.argv[2]);

var game = gameModule.newGame();
var humanPlayer = game.players[0];

var black = "0";
var red   = "1";
var white = "7";
var suitForegrounds = {
  "c": white,
  "d": red,
  "s": white,
  "h": red,
};
function colorize(text, foreground, background, options) {
  var prefixes = [];
  if (background) prefixes.push("\x1b[48;5;" + background + "m");
  if (foreground) prefixes.push("\x1b[38;5;" + foreground + "m");
  if (options.underline) prefixes.push("\x1b[4m");
  return prefixes.join("") + text + "\x1b[0m\x1b[0;0m";
}

process.stdin.setEncoding("utf8");
dump(function(text) {});

function prompt(cb) {
  process.stdout.write("> ");
  process.stdin.once("data", function(input) {
    cb(input.trim());
  });
}
function dump(cb) {
  var playerStrings = game.players.map(function(player) {
    var handString = player.hand.getCardsInOrder().map(function(card) {
      var text = card.profile.rankName + card.profile.suitName;
      var foreground = suitForegrounds[card.profile.suitName];
      var options = {underline: player === humanPlayer};
      return colorize(text, foreground, black, options);
    }).join(" ");
    return player.profile.name + ": " + handString;
  });
  playerStrings.reverse();
  console.log(playerStrings.join("\n"));
  prompt(cb);
}


