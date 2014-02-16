var crage = require("./crage");
var Vector = require("./vector");
var rageData = require("./rageData");

var handSize = 5;

module.exports.newGame = newGame;
function newGame() {
  var game = new crage.Game(getActions);

  game.canvasWidth = 1000;
  game.canvasHeight = 1000;

  // want to fit 20 cards across
  var cardWidth = game.canvasWidth/20;
  // poker size is 2.5x3.5 inches
  var cardHeight = cardWidth*3.5/2.5;
  // corner radius is 1/20 the width of the card
  var cornerRadius = cardWidth/20;
  var borderWidth = cornerRadius;
  var cardMetrics = {
    width: cardWidth, height: cardHeight,
    cornerRadius: cornerRadius, borderWidth: borderWidth,
  };

  var canvasCenter = {x: game.canvasWidth/2, y: game.canvasHeight/2};
  function rotateLayout(layout, rotation) {
    // rotate the center of all this player's locations around on the table.
    layout.center = Vector.rotate(layout.center, canvasCenter, rotation);
    layout.spacing = Vector.rotate(layout.spacing, {x:0, y:0}, rotation);
    return layout;
  }
  [{}, {}].forEach(function(profile, playerIndex) {
    profile.id = game.players.length;
    profile.rotation = Math.PI*playerIndex;
    var player = game.newPlayer(profile);
    player.hand = game.newLocation({
      visibility: player,
      layout: rotateLayout({
        center: {x: game.canvasWidth/2, y: game.canvasHeight*(1/2 + 5/16)},
        spacing: {x: cardWidth, y: 0},
        cardRotation: profile.rotation,
      }, profile.rotation),
    });
    var deckSpacing = cardWidth/30;
    player.deck = game.newLocation({
      visibility: false,
      layout: rotateLayout({
        center: {x: game.canvasWidth/4, y: game.canvasHeight*(1/2 + 5/16)},
        spacing: {x: deckSpacing, y: deckSpacing},
        cardRotation: profile.rotation,
      }, profile.rotation),
    });
    player.discardPile = game.newLocation({
      visibility: true,
      layout: rotateLayout({
        center: {x: game.canvasWidth/2, y: game.canvasHeight*(1/2 + 7/16)},
        spacing: {x: cardWidth/5, y: 0},
        cardRotation: profile.rotation,
      }, profile.rotation),
    });
  });

  // bases
  var bases = [];
  (function() {
    var baseMetrics = {
      width: cardWidth*2, height: cardHeight,
      cornerRadius: cornerRadius, borderWidth: borderWidth,
    };
    var baseLocation = game.newLocation({
      visibility: true,
      layout: {
        center: canvasCenter,
        spacing: {x:0, y:0},
        cardRotation: 0,
      },
    });
    var baseProfile = {
      name: rageData.bases[0].name,
      type: "Base",
    };
    var base = game.newCard(baseProfile, baseMetrics, {group: baseLocation});
    base.playSlots = [];
    game.players.forEach(function(player) {
      base.playSlots.push(game.newLocation({
        visibility: true,
        layout: rotateLayout({
          center: Vector.add(baseLocation.layout.center, {x: 0, y: (baseMetrics.height+cardMetrics.height)/2}),
          spacing: {x: cardMetrics.width, y:0},
          cardRotation: player.profile.rotation,
        }, player.profile.rotation),
      }));
    });
    bases.push(base);
  })();

  // create cards
  game.players.forEach(function(player) {
    var faction = rageData.factions[0];
    faction.cards.forEach(function(cardDefinition) {
      for (var i = 0; i < cardDefinition.count; i++) {
        var cardProfile = {
          name: cardDefinition.name,
          type: cardDefinition.type,
          powerLevels: cardDefinition.powerLevels,
        };
        game.newCard(cardProfile, cardMetrics, {group: player.deck});
      }
    });
    player.deck.shuffle();

    player.deck.getCardsInOrder().slice(0, handSize).forEach(function(card) {
      player.hand.append(card);
    });
  });

  var turnIndex = 0;
  var nextActions = null;
  function getActions() {
    var result = [];
    if (nextActions != null) {
      return nextActions;
    }
    var player = game.players[turnIndex];
    player.hand.getCards().forEach(function(card) {
      result.push(new crage.Action(game, player, {card: card}, function() {
        card.location.positionOffset = Vector.rotate(
            {x:0, y: -card.metrics.height/3},
            {x:0,y:0},
            card.location.rotation);
        nextActions = bases.map(function(base) {
          return new crage.Action(game, player, {card: base}, function() {
            nextActions = null;
            base.playSlots[turnIndex].append(card);
            turnIndex = (turnIndex + 1) % game.players.length;
          });
        });
      }));
    });
    return result;
  }

  game.renderBackground = function(context) {
    context.fillStyle = "#050";
    context.fillRect(0, 0, game.canvasWidth, game.canvasHeight);
  };
  game.renderCardFace = function(context, card) {
    var fontSize = Math.floor((card.metrics.width+card.metrics.height)/18);
    context.fillStyle = "#000";
    context.font = fontSize + "pt sans-serif";
    var x = -card.metrics.width/2 + card.metrics.cornerRadius;
    var y = -card.metrics.height/2 + card.metrics.cornerRadius;
    y += fontSize;
    context.fillText(card.profile.name, x, y);

    if (card.profile.type === "Minion") {
      fontSize = fontSize * 2;
      context.font = fontSize + "pt sans-serif";
      y += fontSize;
      context.fillText(card.profile.powerLevels[0].toString(), x, y);
    }
  };
  return game;
}
