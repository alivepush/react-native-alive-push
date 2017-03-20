/**
 * Created by jean.h.ma on 3/20/17.
 */
var fs = require("fs")
var path = require("path")
var cheerio = require("cheerio")

var readmePath = path.join(__dirname, '../dist/alivepushapi/README.html');

var html = fs.readFileSync(readmePath, 'utf8');

var doc = cheerio.load(html);

console.log(doc('body').html())

doc('body>script').remove();

var body = doc('body').html();

//save fragment
var dist = path.join(__dirname, '../dist');

if (!fs.existsSync(dist)) {
	fs.mkdir(dist);
}

var apiFragment = path.join(dist, 'api-fragment.html');

fs.writeFileSync(apiFragment, body, 'utf8');

//TODO upload api fragment to server
