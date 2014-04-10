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

	imports = [];

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

var re = /^@import [\'\"](.+)[\'\"];$/mi;

function replaceImports(content) {

	while ((match = re.exec(content)) !== null) {

		var fileName = appRoot + match[1];
		var match    = match[0].toString();

		// Check if the file we're trying to import exists
		if (fs.existsSync(fileName)) {

			// Check if the file was already imported somewhere
			if (imports.indexOf(fileName) === -1) {

				// Add the file to the imports list
				imports.push(fileName);

				// Read the imported file
				importContents = fs.readFileSync(fileName, 'utf8');

				// Recursively import files
				importContents = replaceImports(importContents);

				// Place the imported content into the file
				content = content.replace(re, importContents + "\n", "mi");
			}

			// The file was already imported, comment out the line
			else {
				content = content.replace(re, "// Already included: " + fileName + "\n");
			}

		}

		// The file does not exist, print out the error
		else {
			content = content.replace(re, "// Import file does not exist: " + fileName + "\n");
		}

	}

	return content;
}

module.exports = importJS;