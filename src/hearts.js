var crage = require("./crage");
var frenchDeck = require("./frenchDeck");
var Vector = require("./vector");

module.exports.newGame = newGame;
function newGame(metrics) {
  var playerProfiles = [
    {name: "Player 1"},
    {name: "Player 2"},
    {name: "Player 3"},
    {name: "Player 4"},
  ];

  var game = new crage.Game(getActions);
  (function() {
    var canvasCenter = {x: metrics.canvasWidth/2, y: metrics.canvasHeight/2};
    playerProfiles.forEach(function(profile, playerIndex) {
      var player = game.newPlayer(profile);
      // tilt cards based on where the player is sitting.
      var playerTheta = Math.PI*playerIndex/2;
      player.hand = game.newLocation({
        visibility: player,
        layout: rotateLayout({
          center: {x: metrics.canvasWidth/2, y: metrics.canvasHeight*(1/2 + 5/16)},
          spacing: {x: metrics.cardWidth*2/3, y: 0},
          cardRotation: playerTheta,
        }),
      });
      player.playSlot = game.newLocation({
        visibility: true,
        layout: rotateLayout({
          center: {x: metrics.canvasWidth/2, y: metrics.canvasHeight*(1/2 + 1/16)},
          spacing: {x: 0, y: 0},
          cardRotation: 0, // keep the play pile oriented for the human to read
        }),
      });
      player.keepPile = game.newLocation({
        visibility: true,
        layout: rotateLayout({
          center: {x: metrics.canvasWidth/2, y: metrics.canvasHeight*(1/2 + 7/16)},
          spacing: {x: metrics.cardWidth/3, y: 0},
          cardRotation: playerTheta,
        }),
      });
      function rotateLayout(layout) {
        // rotate the center of all this player's locations around on the table.
        layout.center = Vector.rotate(layout.center, canvasCenter, playerTheta);
        layout.spacing = Vector.rotate(layout.spacing, {x:0, y:0}, playerTheta);
        return layout;
      }
    });
  })();

  var deck = game.newLocation({});
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
        mandatoryNextTurn = new crage.Action(game, null, {}, function() {
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
            takerPlayer.keepPile.append(getPlayedCard(player));
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

  game.renderBackground = function(context) {
    context.fillStyle = "#050";
    context.fillRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
  };
  game.renderCardFace = function(context, card) {
    var fontSize = Math.floor(metrics.cardHeight/4);
    context.fillStyle = card.profile.suit.color;
    context.font = fontSize + "pt sans-serif";
    var x = -metrics.cardWidth/2 + metrics.cornerRadius;
    var y = -metrics.cardHeight/2 + metrics.cornerRadius;
    y += fontSize;
    context.fillText(card.profile.rank.name, x, y);
    y += fontSize;
    context.fillText(card.profile.suit.symbol, x, y);
  };

  return game;
}

