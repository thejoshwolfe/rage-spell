var crage = require("./crage");
var frenchDeck = require("./frenchDeck");

module.exports.newGame = newGame;
function newGame() {
  var playerProfiles = [
    {name: "Player 1"},
    {name: "Player 2"},
    {name: "Player 3"},
    {name: "Player 4"},
  ];

  var game = new crage.Game(getActions);
  playerProfiles.forEach(function(profile) {
    var player = game.newPlayer(profile);
    player.hand = game.newLocation();
    player.playSlot = game.newLocation();
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

  var leadSuit = null;
  var turnIndex;
  var mandatoryNextTurn;
  function makePlayCardAction(player, card) {
    var cardName = card.profile.rankName + card.profile.suitName;
    return new crage.Action(game, player, {text: cardName}, function() {
      mandatoryNextTurn = null;
      card.location = player.playSlot;
      turnIndex = (turnIndex + 1) % 4;
      if (leadSuit == null) {
        leadSuit = card.profile.suitName;
      }
      if (isTrickComplete()) {
        // make a confirmation action
        mandatoryNextTurn = new crage.Action(game, game.players[0], {text: ""}, function() {
          mandatoryNextTurn = null;
          var takerPlayer = null;
          var highestRank = -Infinity;
          game.players.forEach(function(player, playerIndex) {
            var card = getPlayedCard(player);
            if (card.profile.suitName !== leadSuit) return;
            if (highestRank == null || highestRank < card.profile.rankNumberAceHigh) {
              highestRank = card.profile.rankNumberAceHigh;
              takerPlayer = player;
              // this guy leads the next trick
              turnIndex = playerIndex;
            }
          });
          // yoink
          game.players.forEach(function(player) {
            getPlayedCard(player).location = takerPlayer.keepPile;
          });
          leadSuit = null;
        });
      }
    });
  }
  function getPlayedCard(player) {
    return player.playSlot.getCards()[0];
  }
  function isTrickComplete() {
    var haventPlayedYet = game.players.filter(function(player) {
      return getPlayedCard(player) == null;
    });
    return haventPlayedYet.length === 0;
  }
  game.players.forEach(function(player, playerIndex) {
    player.hand.getCards().forEach(function(card) {
      if (card.profile.rankName + card.profile.suitName === "2c") {
        turnIndex = playerIndex;
        mandatoryNextTurn = makePlayCardAction(player, card);
      }
    });
  });

  function getCardsInSuits(player, suitNames) {
    var result = [];
    player.hand.getCardsInOrder().forEach(function(card) {
      if (suitNames.indexOf(card.profile.suitName) !== -1) {
        result.push(card);
      }
    });
    return result;
  }

  function getActions() {
    if (mandatoryNextTurn != null) return [mandatoryNextTurn];
    var result = [];
    var player = game.players[turnIndex];
    if (leadSuit != null) {
      getCardsInSuits(player, [leadSuit]).forEach(function(card) {
        result.push(makePlayCardAction(player, card));
      });
    }
    if (result.length === 0) {
      getCardsInSuits(player, ["c", "d", "s"]).forEach(function(card) {
        result.push(makePlayCardAction(player, card));
      });
    }
    if (result.length === 0) {
      getCardsInSuits(player, ["h"]).forEach(function(card) {
        result.push(makePlayCardAction(player, card));
      });
    }
    return result;
  }

  return game;
}

