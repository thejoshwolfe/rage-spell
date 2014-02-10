
var Vector = {
  fromRadiusAndAngle: function(radius, angle) {
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  },
  add: function(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
    };
  },
  subtract: function(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
    };
  },
  scale: function(v, factor) {
    return {
      x: v.x*factor,
      y: v.y*factor,
    };
  },
  magnitude: function(v) {
    return Math.sqrt(v.x*v.x + v.y*v.y);
  },
  angle: function(v) {
    return Math.atan2(v.y, v.x);
  },
  rotate: function(point, origin, theta) {
    var vector = Vector.subtract(point, origin);
    var radius = Vector.magnitude(vector);
    var angle = Vector.angle(vector);
    angle += theta;
    vector = Vector.fromRadiusAndAngle(radius, angle);
    return Vector.add(origin, vector);
  },
};
module.exports = Vector;
