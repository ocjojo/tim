/******************
 * CONFIG SECTION *
 * configure confidential data in config.json
 * an example is in config.json.dist
 ******************/
var config = require("./config.json");

/**
 * Here you can add depencencies, which will be concatenated to the main.min.js,
 * css or html file respectively
 * Only add dependencies from node_modules or lib folder
 * everything else is read automatically
 */
config.jsDeps = [
	//javascript dependencies
	'node_modules/webcomponents.js/webcomponents-lite.min.js',
	'node_modules/promise-polyfill/promise.min.js',
	'node_modules/yapl/index.js',
	'src/js/lib/whenAll.jQuery.js',
];
config.cssDeps = [
	//css dependencies
	'node_modules/select2/dist/css/select2.min.css',
];
config.expaDeps = [
	//html dependencies
	'src/lib/webcomponents-polyfill.html',
	'src/lib/columnView.html',
	'src/lib/sortableTable.html',
];
config.opDeps = [
	//html dependencies
	'src/lib/webcomponents-polyfill.html',
];

/******************
 * GULP Section
 ******************/
var gulp = require('gulp'),
	ts = require('gulp-typescript'),
	uglify = require('gulp-uglify'),
	jsPrettify = require('gulp-js-prettify'),
	y = require('yapl'),
	cssPrettify = require('gulp-cssbeautify'),
	concat = require('gulp-concat'),
	file = require('gulp-file'),
	diff = require('gulp-diff'),
	sourcemaps = require('gulp-sourcemaps'),
	readdir = require('recursive-readdir'),
	path = require('path'),
	sftp = require('gulp-sftp'),
	childProcess = require('child_process'),
	fs = require('fs'),
	expa = require('node-gis-wrapper')(config.expa.user, config.expa.password);

function errorlog(err) {
	console.log(err);
	this.emit('end');
}

// files will be ignored based on this filter
function ignoreFunc(file, stats) {
  // `file` is the absolute path to the file, and `stats` is an `fs.Stats`
  // object returned from `fs.lstat()`.
  return (stats.isDirectory() && path.basename(file) == "lib")
	//ignore files in config dir, include them specifically depending on environment
	|| (stats.isDirectory() && path.basename(file) == "config")
	// ignore files not ending in js/html
	|| (stats.isFile() && !path.extname(file).match("ts|js|html"));
}

// Scripts Task
gulp.task('scripts', function(){
	var def = y();
	//copy init script
	gulp.src('./src/js/timInit.js')
	.pipe(ts({
		noImplicitAny: true,
		target: 'ES5',
		allowJs: true,
		out: 'timInit.js'
	}))
	.pipe(uglify())
	.pipe(gulp.dest('bin'));

	//ignore timInit.js, tim.js as they need to be in a specific order
	//ignoreFunc ignores lib files
	readdir('src/js', ['timInit.js', 'tim.js', ignoreFunc], function (err, files) {
		// files is an array of filename
		files = config.jsDeps.concat('src/js/tim.js', 'src/js/config/dev.js').concat(files);

		//concat and copy all other scripts according to config above
		var t = gulp.src(files)
		.pipe(sourcemaps.init())
		.pipe(ts({
			noImplicitAny: true,
			target: 'ES5',
			allowJs: true,
			out: 'main.min.js'
		}))
		.pipe(uglify())
		.pipe(sourcemaps.write('bin'))
		.pipe(gulp.dest('bin'));

		def.resolve(t);
	});
	return def;
});

gulp.task('scripts-prod', function(){
	//copy init script
	gulp.src('./src/js/timInit.js')
	.pipe(gulp.dest('bin'));

	//ignore timInit.js, tim.js as they need to be in a specific order
	//ignoreFunc ignores lib files
	readdir('src/js', ['timInit.js', 'tim.js', ignoreFunc], function (err, files) {
		// files is an array of filename
		files = config.jsDeps.concat(['src/js/tim.js', 'src/js/config/prod.js']).concat(files);

		//concat and copy all other scripts according to config above
		gulp.src(files)
		.pipe(sourcemaps.init())
		.pipe(ts({
			noImplicitAny: true,
			allowJs: true,
			target: 'ES5',
			out: 'main.min.js'
		}))
		.pipe(uglify())
		.pipe(sourcemaps.write('bin'))
		.pipe(gulp.dest('bin'));
	});
});

//html task: concatenate html
gulp.task('html', function(){
	// build html for experience portal
	readdir('src/expa', [ignoreFunc], function (err, files) {
		if(typeof files == 'undefined') files = [];
		files = config.expaDeps.concat(files.reverse());

		gulp.src(files)
		.pipe(concat('expa.html'))
		.on('error', errorlog)
		.pipe(gulp.dest('bin'));
	});

	//build html for opportunities portal
	readdir('src/op', [ignoreFunc], function (err, files) {
		if(typeof files == 'undefined') files = [];
		files = config.expaDeps.concat(files.reverse());

		gulp.src(files)
		.pipe(concat('op.html'))
		.on('error', errorlog)
		.pipe(gulp.dest('bin'));
	});
});

gulp.task('html-prod', function(){
	readdir('src/expa', [
		//ignore these files for live version
		'test.html',
		'src/html/bookmarklets/*.html',
		'src/expa/analytics/analytics-SnS.html',
		'src/expa/analytics/addSnS.html',
		ignoreFunc], function (err, files) {
		if(typeof files == 'undefined') files = [];
		files = config.expaDeps.concat(files.reverse());

		gulp.src(files)
		.pipe(concat('expa.html'))
		.on('error', errorlog)
		.pipe(gulp.dest('bin'));
	});

	//build html for opportunities portal
	readdir('src/op', [
		//ignore these files for live version
		'test.html',
		'src/op/profile-applications-agb.html',
		ignoreFunc], function (err, files) {
		if(typeof files == 'undefined') files = [];
		files = config.expaDeps.concat(files.reverse());

		gulp.src(files)
		.pipe(concat('op.html'))
		.on('error', errorlog)
		.pipe(gulp.dest('bin'));
	});
});

//css task: concatenate css
gulp.task('css', function(){
	readdir('src/css', [ignoreFunc], function (err, files) {
		files = config.cssDeps.concat(files);

		gulp.src(files)
		.pipe(concat('style.css'))
		.on('error', errorlog)
		.pipe(gulp.dest('bin'));
	});
});

// Watch Task
gulp.task('watch', function(){
	gulp.watch('src/js/**/*.js', ['scripts']);
	gulp.watch('src/css/**/*.css', ['css']);
	gulp.watch('src/op/**/*.html', ['html']);
	gulp.watch('src/expa/**/*.html', ['html']);
});

//build and deploy to server
gulp.task('deploy-expa', ['css', 'html-prod', 'scripts-prod'], function(){
	return gulp.src(['bin/style.css', 'bin/expa.html', 'bin/main.min.js'])
	.pipe(sftp({
		host: config.server.host,
		user: config.server.user,
		remotePath: config.server.livePath,
		agent: process.env.SSH_AUTH_SOCK,
		agentForward: true
	}));
});

//build and deploy to server
gulp.task('deploy-op', ['css', 'html-prod', 'scripts-prod'], function(){
	return gulp.src(['bin/style.css', 'bin/op.html', 'bin/main.min.js'])
	.pipe(sftp({
		host: config.server.host,
		user: config.server.user,
		remotePath: config.server.livePath,
		agent: process.env.SSH_AUTH_SOCK,
		agentForward: true
	}));
});

gulp.task('docs', function(){
	//only generate docs if tim-docs is accessible
	fs.access('../tim-docs', fs.F_OK, function(err) {
		if (!err) {
			childProcess.exec('node_modules/.bin/jsdoc -c jsdoc.json', function (err, stdout, stderr) {
				console.log(stdout);
				console.log(stderr);
			});
		} else {
			console.log("did not generate docs. no access to tim-docs directory");
		}
	});
});

gulp.task('check-expa', function(){

	var saveScript = function(name){
		if(name.indexOf('.css') > 0) {
			return function(content){
				console.log(`Write ${name}`);
				file(name, content, { src: true })
				.pipe(cssPrettify())
				.pipe(gulp.dest('test/expa_src'));
			};
		} else {
			return function(content){
				console.log(`Write ${name}`);
				file(name, content, { src: true })
				.pipe(jsPrettify({collapseWhitespace: true}))
				.pipe(gulp.dest('test/expa_src'));
			};
		}
	};

	expa.get('http://experience.aiesec.org/').then(function(body) {
		var matches = [];
		body.replace(/(?:src|href)=\"((?:scripts|styles)\/(?:vendor|app)-\w*\.(?:js|css))\"/gi, (m, capture) => { matches.push(capture); });
		for(var i in matches){
			var name = matches[i].split('/').pop();
			console.log(`Get ${name}`);
			expa.get('https://experience.aiesec.org/' + matches[i]).then(saveScript(name)).catch(console.log);
		}
	}, console.log);

});

gulp.task('mockserver', function(){

	var mock;
	var projectDir = __dirname.split('/').pop();

	//if in vagrant call server directly
	if(__dirname.match('^/var/www/*')){
		mock = childProcess.execFile('node', ['test/db.js'], {
			"cwd": __dirname
		});
		setTimeout(console.log.bind(null, '  Type e + enter to exit'), 2000);
	// if gulp locally run, enter vagrant via ssh and run server
	} else {
		mock = childProcess.exec('vagrant ssh -c "node /var/www/' + projectDir + '/test/server.js"');
	}

	process.stdin.resume();
	process.stdin.setEncoding('utf8');

	mock.stdout.pipe(process.stdout);
	mock.stderr.pipe(process.stderr);

	process.stdin.on('data', function (chunk) {
		mock.stdin.write(chunk);
		if (chunk.trim().toLowerCase() === 'e') {
			mock.kill();
			process.exit(0);
		}
	});

});

// Default Task
gulp.task('default', ['scripts', 'css', 'html', 'watch']);

gulp.task('deploy', ['deploy-expa']);
