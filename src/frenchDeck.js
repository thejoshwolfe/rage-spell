var crage = require("./crage");

var black = "#000";
var red   = "#f00";
var suits = [
  {id: "c", symbol: "\u2663", color: black},
  {id: "d", symbol: "\u2666", color: red},
  {id: "s", symbol: "\u2660", color: black},
  {id: "h", symbol: "\u2665", color: red},
].map(function(suit, i) {
  // add a sort key appropriate for a game of hearts
  suit.index = i;
  return suit;
});
module.exports.new52Cards = new52Cards;
function new52Cards(game, metrics, locationGroup) {
  var result = [];
  suits.forEach(function(suit) {
    "A 2 3 4 5 6 7 8 9 10 J Q K".split(" ").forEach(function(rankName, rankIndex) {
      var rankNumberAceHigh = rankIndex + 1;
      if (rankNumberAceHigh === 1) rankNumberAceHigh = 14;
      var profile = {
        suit: suit,
        rank: {
          name: rankName,
          number: rankIndex + 1,
          numberAceHigh: rankNumberAceHigh,
        },
      };
      game.newCard(profile, metrics, {group: locationGroup});
    });
  });
  return result;
}

module.exports.compareAceHigh = compareAceHigh;
function compareAceHigh(a, b) {
  var result = crage.operatorCompare(a.profile.suit.index, b.profile.suit.index);
  if (result !== 0) return result;
  return crage.operatorCompare(a.profile.rank.numberAceHigh, b.profile.rank.numberAceHigh);
}
