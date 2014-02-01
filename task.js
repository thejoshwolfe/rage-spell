var fs = require("fs");
var path = require("path");
var watchify = require("watchify");
var browserify = watchify.browserify;
var mkdirp = require("mkdirp");

var appPath = "public/app.js";

({
  build: build,
  dev: function() { build(true); },
})[process.argv[2]]();

function build(isWatch) {
  mkdirp("public", function(err) {
    var compile = isWatch ? watchify : browserify;
    var b = compile(path.resolve('src/app.js'));
    if (isWatch) b.on('update', writeBundle);
    writeBundle();
    function writeBundle() {
      var outStream = b.bundle();
      outStream.on('error', function(err) {
        console.log("error " + err.message);
      });
      outStream.on('close', function() {
        console.log("generated " + appPath);
      });
      outStream.pipe(fs.createWriteStream(appPath));
    }
  });
}
