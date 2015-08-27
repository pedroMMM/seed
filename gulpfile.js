var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-Sync');
var config = require('./gulp.config')();
var del = require('del');
var path = require('path');
var _ = require('lodash');
var wiredep = require('wiredep').stream;
var port = process.env.PORT || config.defaultPort;
var cli = require('shelljs');
var $ = require('gulp-load-plugins')({
    lazy: true
});

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

gulp.task('vet', function () {
    log('Analyzing source with JSHint and JSCS');
    return gulp
        .src(config.alljs)
        .pipe($.plumber())
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {
            verbose: true
        }))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('styles-browser-sync', ['clean-styles'], function () {
    log('Compileing less --> CSS');
    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        .pipe($.autoprefixer({
            browsers: ['> 2%']
        }))
        .pipe(gulp.dest(config.tmp))
        .pipe(browserSync.stream());
});

gulp.task('less-watcher', function () {
    //    gulp.watch(config.less, ['styles']);

    gulp.watch(config.less, ['styles'])
        .on('change', function (event) {
            changeEvent(event);
        });
});

gulp.task('wiredep', function () {
    log('Wire up the bower css, js and our js into the html');
    var options = config.getDefaultWiredepOptions();

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'templatecache'], function () {
    log('Wire up our css into the html and call wiredep');

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['optimize'], function () {
    serve(true);
});

gulp.task('serve-build', ['build'], function () {
    serve(false);
});

gulp.task('images', ['clean-images'], function () {
    log('Copying and compressing images');

    return gulp
        .src(config.images)
        .pipe($.plumber())
        .pipe($.imagemin({
            optimizationLevel: 4
        }))
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean-images', function (cb) {
    log('Cleaing images');

    var files = [config.build + 'images/**/*.*'];
    clean(files, cb);
});

gulp.task('clean-code', function (cb) {
    log('Cleaing code from build folder');

    var files = [config.build + '**/*.*'];
    clean(files, cb);
});

gulp.task('clean', function (cb) {
    log('Cleaing build, tmp and report folders');

    var files = [].concat(config.build, config.tmp, config.report);
    clean(files, cb);
});

gulp.task('templatecache', ['clean-templatecache'], function () {
    log('Creating AngularJS $templateCache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.plumber())
        .pipe($.minifyHtml({
            empty: true
        }))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.tmp));
});

gulp.task('clean-templatecache', function (cb) {
    log('Cleaing template cache file');

    var files = [config.tmp + config.templateCache.file];
    clean(files, cb);
});

//gulp.task('optimize', ['inject', 'test'], function () {
//    log('Optimizing the js, css, html and inject them on the build index');
//
//    var templateCache = config.tmp + config.templateCache.file;
//
//    var assets = $.useref.assets({
//        searchPath: './'
//    });
//
//    var cssFilter = $.filter('**/*.css', {
//        restore: true
//    });
//    var jsLibFilter = $.filter('**/' + config.optimized.lib, {
//        restore: true
//    });
//    var jsAppFilter = $.filter('**/' + config.optimized.app, {
//        restore: true
//    });
//
//    return gulp
//        .src(config.index)
//        .pipe($.plumber())
//        .pipe($.inject(gulp.src(templateCache, {
//            read: false
//        }), {
//            starttag: '<!--    inject:templates:js   -->'
//        }))
//        .pipe(assets)
//        .pipe(cssFilter)
//        .pipe($.csso())
//        .pipe(cssFilter.restore)
//        .pipe(jsLibFilter)
//        .pipe($.uglify())
//        .pipe(jsLibFilter.restore)
//        .pipe(jsAppFilter)
//        .pipe($.ngAnnotate())
//        .pipe($.uglify())
//        .pipe(jsAppFilter.restore)
//        .pipe($.rev())
//        .pipe(assets.restore())
//        .pipe($.useref())
//        .pipe($.revReplace())
//        .pipe(gulp.dest(config.build))
//        .pipe($.rev.manifest())
//        .pipe(gulp.dest(config.build));
//});

//['clean-code'],
gulp.task('cordova', function () {
    log('Moving cordova.js');

    return gulp.src(config.client + 'cordova.js')
        .pipe(gulp.dest(config.build));
});

gulp.task('optimize', ['cordova', 'inject'], function () {
    log('Optimizing the js, css, html and inject them on the build index');

    var templateCache = config.tmp + config.templateCache.file;

    var assets = $.useref.assets({
        searchPath: './'
    });

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, {
            read: false
        }), {
            starttag: '<!--    inject:templates:js   -->'
        }))
        .pipe(assets)
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.inject(gulp.src(config.build + 'cordova.js', {
            read: false
        }), {
            starttag: '<!--    inject:cordova   -->',
            ignorePath: '/www/'
        }))
        .pipe(gulp.dest(config.build));
});

/////////////////////// templatecache as a dependecy
gulp.task('test', ['vet', 'clean-test'], function (cb) {
    startTests(true, cb);
});

gulp.task('auto-test', ['vet', 'templatecache', 'clean-test'], function (cb) {
    startTests(false, cb);
});

gulp.task('clean-test', function (cb) {
    log('Cleaing report folder');

    var files = [config.report + '**/*.*'];
    clean(files, cb);
});

gulp.task('build', ['optimize', 'images'], function () {
    log('Building everything');

    var msg = {
        title: 'gulp build',
        subtitle: 'Deployed to the build folder',
        message: 'Running "gulp serve-build"'
    };

    del(config.tmp);
    log(msg);
    notify(msg);
});

gulp.task('build-specs', ['templatecache'], function () {
    log('Building the spec runner');

    var options = config.getDefaultWiredepOptions();
    options.devDependencies = true;

    return gulp
        .src(config.specRunner)
        .pipe($.plumber())
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.testLibraties), {
            name: 'inject:testlibraries',
            read: false
        }))
        .pipe($.inject(gulp.src(config.js)))
        .pipe($.inject(gulp.src(config.specHelpers), {
            name: 'inject:specHelpers',
            read: false
        }))
        .pipe($.inject(gulp.src(config.specs), {
            name: 'inject:specs',
            read: false
        }))
        .pipe($.inject(gulp.src(config.tmp + config.templateCache.file), {
            name: 'inject:templates',
            read: false
        }))
        .pipe(gulp.dest(config.root));
});

gulp.task('serve-specs', ['build-specs'], function (cb) {
    log('Running the spec runner');
    serve(false, true);
    cb();
});

/*
 * Generic methods
 */

function startTests(singleRun, cb) {
    var karma = require('karma').server;
    var serverSpecs = config.serverIntegrationSpecs;
    var excludeFiles = serverSpecs;

    karma.start({
        configFile: __dirname + '/karma.conf.js',
        exclude: excludeFiles,
        singleRun: !!singleRun
    }, karmaCompleted);

    function karmaCompleted(karmaResult) {
        log('Karma completed!');
        if (karmaResult === 1) {
            cb('karma: tests failed with code ' + karmaResult);
        } else {
            cb();
        }
    }
}

function serve(isDev, specRunner) {

    gulp.watch([
            config.css,
            config.js,
            config.html
        ], [
            'optimize'
        ]).on('change', function (event) {
        changeEvent(event);
    });

    if (specRunner) {
        startBrowserSync();
    }

    if (isDev) {
        cli.exec('ionic serve -l', {
            async: true
        });
    }

}

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function notify(options) {
    var notifier = require('node-notifier');
    var notifyOptions = {
        sound: 'Bottle',
        contentImage: path.join(__dirname, 'gulp.png'),
        icon: path.join(__dirname, 'gulp.png')
    };
    _.assign(notifyOptions, options);
    notifier.notify(notifyOptions);
}

function startBrowserSync() {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync on port ' + port);

    gulp.watch([
            config.css,
            config.js,
            config.html
        ], [
            'optimize',
            browserSync.reload
        ]).on('change', function (event) {
        changeEvent(event);
    });

    var options = {
        //        proxy: 'localhost:' + port,
        server: {
            index: 'specs.html'
        },
        port: 3000,
        files: [
            config.allbuild,
            config.specs
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChaanges: true,
        logLevel: 'debug',
        logPrefix: 'browser-sync',
        notify: true,
        reloadDelay: 1000,
        /*browser: [win->'chrome', mac->'google chrome'],*/
        //        browser: ['google chrome'],

        open: true
    };

    options.startPath = config.specRunnerFile;

    browserSync(options);
}

function clean(path, cb) {
    log('Cleaing: ' + $.util.colors.blue(path));
    del(path, cb);
}

function log(msg) {
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
