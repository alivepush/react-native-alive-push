/**
 * Created by jean.h.ma on 3/20/17.
 */
var path = require("path");
var fs = require("fs");
var Markdown = require('markdown-to-html').GithubMarkdown;
var md = new Markdown();
md.bufmax = 2048;
var fileName = path.join(__dirname, '../README.md');
var opts = {highlight: true};
md.render(fileName, opts, function (err) {
	if (err) {
		console.error('>>>' + err);
		process.exit();
	}
	//save
	var dist = path.join(__dirname, '../dist');
	if (!fs.existsSync(dist)) {
		fs.mkdirSync(dist);
	}
	var htmlDoc = path.join(dist, 'alivepush-api.html');
	fs.writeFileSync(htmlDoc, md.html, 'utf8');
});