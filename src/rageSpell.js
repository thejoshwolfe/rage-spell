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
  var handY = game.canvasHeight*(1/2 + 5/16);
  [{}, {}].forEach(function(profile, playerIndex) {
    profile.id = game.players.length;
    profile.rotation = Math.PI*playerIndex;
    var player = game.newPlayer(profile);
    player.hand = game.newLocation({
      visibility: player,
      layout: rotateLayout({
        center: {x: game.canvasWidth/2, y: handY},
        spacing: {x: cardWidth, y: 0},
        cardRotation: player.profile.rotation,
      }, player.profile.rotation),
    });
    var deckSpacing = cardWidth/30;
    player.deck = game.newLocation({
      visibility: false,
      layout: rotateLayout({
        center: {x: game.canvasWidth/4, y: handY},
        spacing: {x: deckSpacing, y: deckSpacing},
        cardRotation: player.profile.rotation,
      }, player.profile.rotation),
    });
    player.discardPile = game.newLocation({
      visibility: true,
      layout: rotateLayout({
        center: {x: game.canvasWidth/2, y: game.canvasHeight*(1/2 + 7/16)},
        spacing: {x: cardWidth/5, y: 0},
        cardRotation: player.profile.rotation,
      }, player.profile.rotation),
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

  // create buttons
  var buttonHeight = cardHeight/2;
  var buttonMetrics = {
    width: cardWidth*3/2, height: cardHeight/2,
    cornerRadius: cornerRadius*4, borderWidth: borderWidth,
  };
  game.players.forEach(function(player) {
    player.buttonBar = game.newLocation({
      visibility: player,
      layout: rotateLayout({
        center: {x: game.canvasWidth/2+cardWidth*handSize/2+buttonMetrics.width, y: handY},
        spacing: {x: 0, y: buttonHeight},
        cardRotation: player.profile.rotation,
      }, player.profile.rotation),
    });

    player.doneButton = game.newCard({name: "[set elsewhere]", type: "Button"}, buttonMetrics, {});
  });

  // action state machine
  var turnIndex = 0;
  var playPhase = "play";
  var turnPhase = playPhase;
  var selectedCardToPlay = null;
  var discardPhase = "discard";
  var selectedCardsToDiscard = [];
  var drawPhase = "draw";
  function offsetCard(card, direction) {
    card.location.positionOffset = Vector.rotate(
        {x:0, y: direction * card.metrics.height/3},
        {x:0,y:0},
        card.location.rotation);
  }
  function getActions() {
    var result = [];
    var player = game.players[turnIndex];
    switch (turnPhase) {
      case playPhase:
        if (selectedCardToPlay == null) {
          // select a card in your hand
          player.hand.getCards().forEach(function(card) {
            result.push(new crage.Action(game, player, {card: card}, function() {
              selectedCardToPlay = card;
              // offset the card upward
              offsetCard(card, -1);
              player.doneButton.location = {};
            }));
          });
          // done with playing cards
          player.doneButton.profile.name = "Done";
          player.doneButton.location = {group: player.buttonBar};
          result.push(new crage.Action(game, player, {card: player.doneButton}, function() {
            player.doneButton.location = {};
            turnPhase = discardPhase;
          }));
        } else {
          // play the selected card on a base
          bases.forEach(function(base) {
            result.push(new crage.Action(game, player, {card: base}, function() {
              base.playSlots[turnIndex].append(selectedCardToPlay);
              selectedCardToPlay = null;
            }));
          });
          // un select the card
          var actionProfile = {card: selectedCardToPlay, excludeFromRandom: true};
          result.push(new crage.Action(game, player, actionProfile, function() {
            selectedCardToPlay.location.positionOffset = null;
            selectedCardToPlay = null;
          }));
        }
        break;
      case discardPhase:
        // select/unselect cards for discard
        player.hand.getCards().forEach(function(card) {
          var actionProfile = {
            card: card,
            excludeFromRandom: selectedCardsToDiscard.indexOf(card) !== -1,
          };
          result.push(new crage.Action(game, player, actionProfile, function() {
            var index = selectedCardsToDiscard.indexOf(card);
            if (index === -1) {
              selectedCardsToDiscard.push(card);
              // offset card downward
              offsetCard(card, 1);
            } else {
              selectedCardsToDiscard.splice(index, 1);
              card.location.positionOffset = null;
            }
          }));
        });
        // done with discarding
        player.doneButton.profile.name = "Discard";
        player.doneButton.location = {group: player.buttonBar};
        result.push(new crage.Action(game, player, {card: player.doneButton}, function() {
          selectedCardsToDiscard.forEach(function(card) {
            player.discardPile.append(card);
          });
          selectedCardsToDiscard = [];
          player.doneButton.location = {};
          turnPhase = drawPhase;
        }));
        break;
      case drawPhase:
        var deckCards = player.deck.getCardsInOrder();
        if (deckCards.length > 0 && player.hand.getCards().length < handSize) {
          var topDeckCard = deckCards[deckCards.length - 1];
          // draw 1 card at a time
          player.doneButton.profile.name = "Draw";
          player.doneButton.location = {group: player.buttonBar};
          result.push(new crage.Action(game, player, {card: player.doneButton}, function() {
            player.hand.append(topDeckCard);
          }));
        } else {
          // done with drawing
          player.doneButton.profile.name = "Done";
          player.doneButton.location = {group: player.buttonBar};
          result.push(new crage.Action(game, player, {card: player.doneButton}, function() {
            player.doneButton.location = {};
            turnIndex = (turnIndex + 1) % game.players.length;
            turnPhase = playPhase;
          }));
        }
        break;
    }
    return result;
  }

  // rendering
  game.renderBackground = function(context) {
    context.fillStyle = "#050";
    context.fillRect(0, 0, game.canvasWidth, game.canvasHeight);
  };
  game.renderCardFace = function(context, card) {
    var fontSize;
    if (card.profile.type === "Button") {
      fontSize = (card.metrics.height - card.metrics.cornerRadius*2);
    } else {
      // leave room for multiple lines and stuff
      fontSize = Math.floor((card.metrics.width+card.metrics.height)/18);
    }
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
