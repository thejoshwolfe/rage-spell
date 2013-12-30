var crage = require("./crage");

module.exports.new52Cards = new52Cards;
function new52Cards(game, location) {
  var result = [];
  "c d s h".split(" ").forEach(function(suitName, suitIndex) {
    "A 2 3 4 5 6 7 8 9 T J Q K".split(" ").forEach(function(rankName, rankIndex) {
      var rankNumberAceHigh = rankIndex + 1;
      if (rankNumberAceHigh === 1) rankNumberAceHigh = 14;
      var profile = {
        suitName: suitName,
        suitNumber: suitIndex + 1,
        rankName: rankName,
        rankNumber: rankIndex + 1,
        rankNumberAceHigh: rankNumberAceHigh,
      };
      game.newCard(profile, location);
    });
  });
  return result;
}

module.exports.compareAceHigh = compareAceHigh;
function compareAceHigh(a, b) {
  var result = crage.operatorCompare(a.profile.suitNumber, b.profile.suitNumber);
  if (result !== 0) return result;
  return crage.operatorCompare(a.profile.rankNumberAceHigh, b.profile.rankNumberAceHigh);
}
