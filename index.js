var through = require('through2'),
	gutil   = require('gulp-util'),
	fs      = require('fs'),
	path    = require('path'),
	imports = [],
	PluginError = gutil.PluginError,
	appRoot = path.dirname(module.parent.filename);

const PLUGIN_NAME = 'gulp-importjs';

function importStream(content) {
	var stream = through();
	stream.write(content);
	return stream;
}

function importJS(appDir) {
	// Allow passing of a new app root
	if(typeof appDir === 'string'){
		appRoot = appDir;
	}

	var stream = through.obj(function(file, enc, callback) {
		// Reset the imports object	
		imports = [];

		if (file.isNull()) {
			// Do nothing
		}
		var compiled = null;
		if (file.isBuffer()) {
			compiled = replaceImports(file.contents.toString());
			if (compiled.err) {
				return callback(compiled.err);
			}
			file.contents = new Buffer(compiled.result);
		}

		if (file.isStream()) {
			compiled = replaceImports(file.contents.toString());
			if (compiled.err) {
				return callback(compiled.err);
			}
			file.contents = file.contents.pipe(importStream(new Buffer(compiled.result)));
		}

		this.push(file);
		return callback();
	});

	return stream;
}

//group - escaped tic, escaped quote, then anything, then escaped tic or escaped quote, then semicolon, then (optional) whitespace
var re = /^@import [\'\"](.+)[\'\"];[\s]*$/mi;

/**
 * @return {Object}         2 properties : err (optional) and result
 */
function replaceImports(content) {
	var err = null;
	while ((match = re.exec(content)) !== null) {
		match = match.map(function (argument) {
			return argument.trim();
		});
		var fileName = appRoot + match[1].trim();
		var match    = match[0].toString();
		// Check if the file we're trying to import exists
		if (fs.existsSync(fileName)) {
			// Check if the file was already imported somewhere
			if (imports.indexOf(fileName) === -1) {

				// Add the file to the imports list
				imports.push(fileName);

				// Read the imported file
				// *** Replace dollar signs so submatches don't get replaced
				importContents = fs.readFileSync(fileName, 'utf8').replace(/\$/g, '$$$$');

				// Recursively import files
				var recursiveResults = replaceImports(importContents);
				if (recursiveResults.err) {
					err = recursiveResults.err;
					break;
				}
				importContents = recursiveResults.result; //replaceImports(importContents);

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
			err = new PluginError('gulp-importjs', ' Import file does not exist: ' + fileName + '\n');
			break;
		}

	}
	return {
		result 	: content,
		err 	: err
	};
}

module.exports = importJS;