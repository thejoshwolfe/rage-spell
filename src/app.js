var crage = require("./crage");
var hearts = require("./hearts");
var Vector = require("./vector");
var canvas = window.document.getElementById("canvas");

// all coordinates are scaled to these dimensions
var canvasWidth = 300;
var canvasHeight = 300;

// want to fit 20 cards across
var cardWidth = canvasWidth/20;
// poker size is 2.5x3.5 inches
var cardHeight = cardWidth*3.5/2.5;
// corner radius is 1/20 the width of the card
var cornerRadius = cardWidth/20;
var borderWidth = cornerRadius;
var fontSize = Math.floor(cardHeight/4);
function mousePointToScaledPoint(point) {
  return {
    x: point.x / canvas.width * canvasWidth,
    y: point.y / canvas.height * canvasHeight,
  };
}

var game = hearts.newGame();
var cardsInZOrder;
var controlEverything = false;
var zoomInCard = null;
var theHuman = game.players[0];
var playerRotations = [
  0,          // human
  Math.PI/2,  // left
  Math.PI,    // across
  -Math.PI/2, // right
];
(function() {
  // where should the locations be rendered?
  var z = 0;
  var canvasCenter = {x: canvasWidth/2, y: canvasHeight/2};
  game.players.forEach(function(player, playerIndex) {
    // tilt cards based on where the player is sitting.
    var playerTheta = playerRotations[playerIndex];

    player.hand.layout = rotateLayout({
      center: {x: canvasWidth/2, y: canvasHeight*(1/2 + 5/16)},
      spacing: {x: cardWidth*2/3, y: 0},
      cardRotation: playerTheta,
      z: z++,
    });
    player.playSlot.layout = rotateLayout({
      center: {x: canvasWidth/2, y: canvasHeight*(1/2 + 1/16)},
      spacing: {x: 0, y: 0},
      cardRotation: 0, // keep the play pile oriented for the human to read
      z: z++,
    });
    player.keepPile.layout = rotateLayout({
      center: {x: canvasWidth/2, y: canvasHeight*(1/2 + 7/16)},
      spacing: {x: cardWidth/3, y: 0},
      cardRotation: playerTheta,
      z: z++,
    });
    function rotateLayout(layout) {
      // rotate the center of all this player's locations around on the table.
      layout.center = Vector.rotate(layout.center, canvasCenter, playerTheta);
      layout.spacing = Vector.rotate(layout.spacing, {x:0, y:0}, playerTheta);
      return layout;
    }
  });
})();

var actions;
function refreshActions() {
  actions = game.getActions();
  refreshDisplay();
}
function computeLocationGroupLocations(locationGroup) {
  if (locationGroup.layout == null) return;
  var cards = locationGroup.getCardsInOrder();
  var position = locationGroup.layout.center;
  var spacing = locationGroup.layout.spacing;
  var cardRotation = locationGroup.layout.cardRotation;
  // the cards should all be centered
  position = Vector.subtract(position, Vector.scale(spacing, (cards.length-1)/2));
  var z = locationGroup.layout.z;
  var dz = 1/cards.length;
  cards.forEach(function(card) {
    card.location.position = position;
    card.location.z = z;
    card.location.rotation = cardRotation;
    position = Vector.add(position, spacing);
    z += dz;
  });
}
function computeLocations() {
  game.locations.forEach(computeLocationGroupLocations);
  cardsInZOrder = game.cards.slice(0);
  cardsInZOrder.sort(function(cardA, cardB) {
    return crage.operatorCompare(cardA.location.z, cardB.location.z);
  });
}

function refreshDisplay() {
  computeLocations();
  render();
}
function render() {
  var context = canvas.getContext("2d");
  context.save();

  context.scale(canvas.width/canvasWidth, canvas.height/canvasHeight);
  context.fillStyle = "#050";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  var actionCards = actions.filter(function(action) {
    return controlEverything || action.player === theHuman;
  }).map(function(action) {
    return action.data.card;
  });
  cardsInZOrder.forEach(function(card) {
    var enabled = actionCards.indexOf(card) !== -1;
    var faceUp = isFaceUp(card);
    context.save();
    context.translate(card.location.position.x, card.location.position.y);
    context.rotate(card.location.rotation);
    renderCard(context, card, enabled, faceUp);
    context.restore();
  });
  context.restore();

  if (zoomInCard != null) {
    // draw cover shade
    context.save();
    context.globalAlpha = 0.7;
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
    // render a super huge card
    context.save();
    var zoomFactor = cardHeight;
    context.scale(canvas.width/zoomFactor, canvas.height/zoomFactor);
    context.translate(zoomFactor/2, zoomFactor/2);
    renderCard(context, zoomInCard, false, true);
    context.restore();
  }
}
function isFaceUp(card) {
  if (controlEverything) return true;
  var visibility = card.location.group.visibility;
  return visibility === true || visibility === theHuman;
}

var animationInterval = 500;
window.setInterval(render, animationInterval);
var animationReferenceTime = new Date().getTime();
var colorAnimation = ["#dd0", "#44f"];

function renderCard(context, card, enabled, faceUp) {
  context.save();

  if (faceUp && enabled) {
    roundedCornerRectPath(context,
        -cardWidth/2 - 2 * cornerRadius, -cardHeight/2 - 2 * cornerRadius,
        cardWidth    + 4 * cornerRadius, cardHeight    + 4 * cornerRadius,
        cornerRadius);
    var time = new Date().getTime() - animationReferenceTime;
    var animationIndex = Math.floor(time / animationInterval) % colorAnimation.length;
    context.fillStyle = colorAnimation[animationIndex];
    context.fill();
  }
  roundedCornerRectPath(context,
      -cardWidth/2, -cardHeight/2,
      cardWidth, cardHeight,
      cornerRadius);
  context.fillStyle = "#fff";
  context.fill();

  if (faceUp) {
    context.fillStyle = card.profile.suit.color;
    context.font = fontSize + "pt sans-serif";
    var x = -cardWidth/2 + cornerRadius;
    var y = -cardHeight/2 + cornerRadius;
    y += fontSize;
    context.fillText(card.profile.rank.name, x, y);
    y += fontSize;
    context.fillText(card.profile.suit.symbol, x, y);
  } else {
    // render the back of a card
    roundedCornerRectPath(context,
        -cardWidth/2 + borderWidth, -cardHeight/2 + borderWidth,
        cardWidth - borderWidth*2, cardHeight - borderWidth*2,
        cornerRadius);
    context.fillStyle = "#aaf";
    context.fill();
  }

  context.restore();
}
function roundedCornerRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x      +radius, y);
  context. arcTo(x+width       , y              , x+width       , y       +radius, radius);
  context. arcTo(x+width       , y+height       , x+width-radius, y+height       , radius);
  context. arcTo(x             , y+height       , x             , y+height-radius, radius);
  context. arcTo(x             , y              , x      +radius, y              , radius);
}

window.addEventListener("resize", function() {
  resize();
  refreshDisplay();
});
resize();
function resize() {
  // keep the canvas the center of attention
  if (window.innerWidth / canvasWidth < window.innerHeight / canvasHeight) {
    canvas.width = window.innerWidth;
    canvas.height = canvasHeight * canvas.width / canvasWidth;
    canvas.style.left = "0px";
    canvas.style.top = ((window.innerHeight - canvas.height) / 2) + "px";
  } else {
    canvas.height = window.innerHeight;
    canvas.width = canvasWidth * canvas.height / canvasHeight;
    canvas.style.left = ((window.innerWidth - canvas.width) / 2) + "px";
    canvas.style.top = "0px";
  }
}

function isPointInCard(point, card) {
  // rotate this point into our world, then compare the axis-aligned bounding box.
  point = Vector.rotate(point, card.location.position, -card.location.rotation);
  if (point.x < card.location.position.x - cardWidth/2)  return false;
  if (point.y < card.location.position.y - cardHeight/2) return false;
  if (point.x > card.location.position.x + cardWidth/2)  return false;
  if (point.y > card.location.position.y + cardHeight/2) return false;
  return true;
}
canvas.addEventListener("mousedown", function(event) {
  event.preventDefault();
  if (zoomInCard != null) {
    zoomInCard = null;
    return;
  }
  if (event.button === 0) {
    // left click
    if (actions.length === 0) return; // game over
    var clickedAction;
    if (controlEverything || actions[0].player === theHuman) {
      // human clicks
      var clickedCard = getClickedCard();
      var clickedActions = actions.filter(function(action) {
        return action.data.card == null || action.data.card === clickedCard;
      });
      if (clickedActions.length === 0) return;
      // assume 1 action per card
      clickedAction = clickedActions[0];
    } else {
      // push the computers along
      clickedAction = actions[Math.floor(Math.random() * actions.length)];
    }
    clickedAction.func();
    refreshActions();
  } else if (event.button === 2) {
    var clickedCard = getClickedCard();
    if (clickedCard == null) return;
    if (isFaceUp(clickedCard)) {
      // show the user a closeup
      zoomInCard = clickedCard;
      render();
    }
  }

  function getClickedCard() {
    var point = mousePointToScaledPoint({x: event.layerX, y: event.layerY});
    for (var i = cardsInZOrder.length - 1; i >= 0; i--) {
      var card = cardsInZOrder[i];
      if (isPointInCard(point, card)) {
        return card;
      }
    };
    return null;
  }
});

canvas.addEventListener("contextmenu", function(event) {
  event.preventDefault();
});

window.document.addEventListener("keydown", function(event) {
  if (event.ctrlKey) return;
  var char = String.fromCharCode(event.keyCode);
  var func = {
    "P": function() {
      controlEverything = !controlEverything;
      refreshDisplay();
    },
  }[char];
  if (func == null) return;
  func();
  event.preventDefault();
});

refreshActions();
