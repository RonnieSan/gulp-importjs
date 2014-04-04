var through = require('through2'),
	gutil   = require('gulp-util'),
	path    = require('path'),
	fs      = require('fs'),
	url     = require('url'),
	imports = [];

const PLUGIN_NAME = 'gulp-importjs';

function importJSStream(content) {
	var stream = through();
	stream.write(replaceImports(content));
	return stream;
}

function importJS() {

	var stream = through.obj(function(file, enc, callback) {
		
		if (file.isNull()) {
			// Do nothing
		}
		
		if (file.isBuffer() && content.match(/@import[^;|\n]*(;|\n)/gi) !== null) {
			file.contents = replaceImports(file.contents);
		}

		if (file.isStream()) {
			file.contents = file.contents.pipe(importJSStream(file.contents));
		}

		this.push(file);
		return callback();
	})

	return stream;
}

function replaceImports(content) {
	var matches = content.match(/@import[^;|\n]*(;|\n)/gi);
	var limit   = matches.length;

	if (matches !== null) {
		for (var n = 0; n < limit; n++) {
			match    = matches[n];
			fileName = match.replace(/@import|[\'\"\s\;\n']/gi); // Extract the filepath
			fs.existsSync(fileName, function(fileExists) {

				// The file exists, add it to an imported array and include it in the content
				if (fileExists) {
					imports.push(fileName);
					importContents = fs.readFileSync(fileName);
					content = content.replace(match, importContents + "\n");
				} else {
					content = content.replace(match, "// Error importing: " + match);
				}

			});
		}

		replaceImports(content);
	}

	return content;
}

module.exports = importJS;