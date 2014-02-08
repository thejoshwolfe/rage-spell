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
    card.location = {group: game.players[index % 4].hand};
  });
  game.players.forEach(function(player) {
    player.hand.sort(frenchDeck.compareAceHigh);
  });

  var leadSuit = null;
  var turnIndex;
  var mandatoryNextTurn;
  var heartsAreBroken = false;
  function makePlayCardAction(player, card) {
    return new crage.Action(game, player, {card: card}, function() {
      mandatoryNextTurn = null;
      card.location = {group: player.playSlot};
      turnIndex = (turnIndex + 1) % 4;
      if (leadSuit == null) {
        leadSuit = card.profile.suit.id;
      }
      if (card.profile.suit.id === "h") {
        heartsAreBroken = true;
      }
      if (isTrickComplete()) {
        // make a confirmation action
        mandatoryNextTurn = new crage.Action(game, game.players[0], {}, function() {
          mandatoryNextTurn = null;
          var takerPlayer = null;
          var highestRank = -Infinity;
          game.players.forEach(function(player, playerIndex) {
            var card = getPlayedCard(player);
            if (card.profile.suit.id !== leadSuit) return;
            if (highestRank == null || highestRank < card.profile.rank.numberAceHigh) {
              highestRank = card.profile.rank.numberAceHigh;
              takerPlayer = player;
              // this guy leads the next trick
              turnIndex = playerIndex;
            }
          });
          // yoink
          game.players.forEach(function(player) {
            getPlayedCard(player).location = {
              group: takerPlayer.keepPile,
              index: takerPlayer.keepPile.getCards().length,
            };
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
      if (card.profile.rank.name + card.profile.suit.id === "2c") {
        turnIndex = playerIndex;
        mandatoryNextTurn = makePlayCardAction(player, card);
      }
    });
  });

  function getActions() {
    if (mandatoryNextTurn != null) return [mandatoryNextTurn];
    var result = [];
    var player = game.players[turnIndex];
    function makeActionsForSuits(suitNames) {
      player.hand.getCardsInOrder().forEach(function(card) {
        if (suitNames.indexOf(card.profile.suit.id) !== -1) {
          result.push(makePlayCardAction(player, card));
        }
      });
    }
    if (leadSuit != null) {
      makeActionsForSuits([leadSuit]);
      if (result.length === 0) {
        makeActionsForSuits(["c", "d", "s", "h"]);
      }
    } else {
      if (heartsAreBroken) {
        makeActionsForSuits(["c", "d", "s", "h"]);
      } else {
        makeActionsForSuits(["c", "d", "s"]);
      }
    }
    return result;
  }

  return game;
}

