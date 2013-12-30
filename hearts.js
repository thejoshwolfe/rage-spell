var crage = require("./crage");
var frenchDeck = require("./frenchDeck");

module.exports.newGame = newGame;
function newGame(playerProfiles) {
  if (playerProfiles == null) {
    playerProfiles = [
      {name: "Player 1"},
      {name: "Player 2"},
      {name: "Player 3"},
      {name: "Player 4"},
    ];
  }

  var game = new crage.Game();
  playerProfiles.forEach(function(profile) {
    var player = game.newPlayer(profile);
    player.hand = game.newLocation();
    player.keepPile = game.newLocation();
  });

  var deck = game.newLocation();
  frenchDeck.new52Cards(game, deck);

  // deal
  deck.shuffle();
  deck.getCardsInOrder().forEach(function(card, index) {
    card.location = game.players[index % 4].hand;
  });
  game.players.forEach(function(player) {
    player.hand.sort(frenchDeck.compareAceHigh);
  });

  return game;
}

