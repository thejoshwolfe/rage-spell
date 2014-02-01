process.stdin.setEncoding("utf8");

var gameModule = require(process.argv[2]);

var game = gameModule.newGame();

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

displayAndPromptForAction();

function prompt(cb) {
  process.stdout.write("> ");
  process.stdin.once("data", function(input) {
    cb(input.trim());
  });
}
function cardToString(card) {
  var text = card.profile.rankName + card.profile.suitName;
  var foreground = suitForegrounds[card.profile.suitName];
  return colorize(text, foreground, black, {});
}

function displayAndPromptForAction() {
  display();
  var actions = game.getActions();
  promptForAction(actions);
}

function display() {
  var playerStrings = game.players.map(function(player) {
    var handString = player.hand.getCardsInOrder().map(cardToString).join(" ");
    var keepString = player.keepPile.getCardsInOrder().map(cardToString).join(" ");
    return player.profile.name + ": " + handString + " - " + keepString;
  });
  console.log(playerStrings.join("\n"));

  var playedString = game.players.map(function(player) {
    var playedCard = player.playSlot.getCards()[0];
    return playedCard == null ? "  " : cardToString(playedCard);
  }).join(" ");
  console.log(playedString);
}

function promptForAction(actions) {
  var actionStrings = actions.map(function(action) {
    return action.data.text;
  });
  console.log(actions[0].player.profile.name + ": " + actionStrings.join(" "));
  prompt(function(text) {
    var chosenActions = actions.filter(function(action) {
      return action.data.text.toLowerCase() === text.toLowerCase();
    });
    if (chosenActions.length !== 1) {
      console.log("bad");
      return promptForAction(actions);
    }
    var action = chosenActions[0];
    action.func();
    displayAndPromptForAction();
  });
}

