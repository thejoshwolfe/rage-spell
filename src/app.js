var crage = require("../crage");
var frenchDeck = require("../frenchDeck");
var game = new crage.Game(function() { return []; });
var deck = game.newLocation();
frenchDeck.new52Cards(game, deck);

var canvas = document.getElementById("canvas");

// for simplicity and scalability, we scale the units to 3x2
var canvasWidth = 300;
var canvasHeight = 200;

// want to fit 20 cards across
var cardWidth = canvasWidth/20;
// poker size is 2.5x3.5 inches
var cardHeight = cardWidth*3.5/2.5;
// corner radius is 1/20 the width of the card
var cornerRadius = cardWidth/20;
var fontSize = Math.floor(cardHeight/4);

var suitSymbols = {
  s: "\u2660",
  c: "\u2663",
  h: "\u2665",
  d: "\u2666",
};
var suitColors = {
  s: "#000",
  c: "#000",
  h: "#f00",
  d: "#f00",
};
(function() {
  var x = 0;
  var y = 0;
  deck.getCardsInOrder().forEach(function(card) {
    card.x = x;
    card.y = y;
    x += cardWidth;
    if (x >= canvasWidth) {
      x = 0;
      y += cardHeight;
    }
  });
})();

render();
function render() {
  var context = canvas.getContext("2d");
  context.save();

  context.scale(canvas.width/canvasWidth, canvas.height/canvasHeight);
  context.fillStyle = "#050";
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  deck.getCardsInOrder().forEach(function(card) {
    context.fillStyle = "#fff";
    roundedCornerRect(context, card.x, card.y, cardWidth, cardHeight, cornerRadius);

    var rankSymbol = card.profile.rankName;
    if (rankSymbol === "T") rankSymbol = "10";
    var suitSymbol = suitSymbols[card.profile.suitName];
    var suitColor = suitColors[card.profile.suitName];
    context.fillStyle = suitColor;
    context.font = fontSize + "pt sans-serif";
    var x = card.x+cornerRadius;
    var y = card.y+cornerRadius;
    y += fontSize;
    context.fillText(rankSymbol, x, y);
    y += fontSize;
    context.fillText(suitSymbol, x, y);
  });

  context.restore();
  requestAnimationFrame(render);
}
function roundedCornerRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x      +radius, y);
  context. arcTo(x+width       , y              , x+width       , y       +radius, radius);
  context. arcTo(x+width       , y+height       , x+width-radius, y+height       , radius);
  context. arcTo(x             , y+height       , x             , y+height-radius, radius);
  context. arcTo(x             , y              , x      +radius, y              , radius);
  context.fill();
}

resize();
window.addEventListener("resize", resize);
function resize() {
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

