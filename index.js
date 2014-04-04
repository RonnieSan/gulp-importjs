var through = require('through2'),
	gutil   = require('gulp-util'),
	fs      = require('fs'),
	path    = require('path'),
	imports = [],
	appRoot = path.dirname(module.parent.filename);

const PLUGIN_NAME = 'gulp-importjs';

function importStream(content) {
	var stream = through();
	stream.write(content);
	return stream;
}

function importJS() {

	var stream = through.obj(function(file, enc, callback) {

		if (file.isNull()) {
			// Do nothing
		}
		
		if (file.isBuffer()) {
			file.contents = new Buffer(replaceImports(file.contents.toString()));
		}

		if (file.isStream()) {
			file.contents = file.contents.pipe(importStream(new Buffer(replaceImports(file.contents.toString()))));
		}

		this.push(file);
		return callback();
	});

	return stream;
}

function replaceImports(content) {
	var matches = content.match(/@import.+;?/gi);

	if (matches !== null) {
		var limit = matches.length;
		for (var n = 0; n < limit; n++) {
			match    = matches[n];
			fileName = appRoot + match.replace(/@import|[\'\"\s\;\n']/gi, ""); // Extract the filepath

			console.log(fileName);

			if (fs.existsSync(fileName)) {

				// If the file was already imported somewhere, don't import it again
				if (imports.indexOf(fileName) === -1) {
					imports.push(fileName);
					importContents = fs.readFileSync(fileName);
					content = content.replace(match, importContents + "\n");
					content = replaceImports(content);
				} else {
					content = content.replace(match, "// Already included: " + match + "\n");
				}
			} else {
				content = content.replace(match, "// Error importing: " + match + "\n");
			}
		}
	}

	return content;
}

module.exports = importJS;