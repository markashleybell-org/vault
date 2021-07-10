/// <binding ProjectOpened='copy-bootstrap-sources, watch-scss' />

const { src, dest, watch, series } = require('gulp');

const sassCompiler = require('sass');
const sass = require('gulp-sass')(sassCompiler);
const autoprefixer = require('gulp-autoprefixer');

const scssOptions = {
    precision: 10,
    outputStyle: 'expanded',
    indentWidth: 4
};

const copyBootstrapSource = () =>
    src('./node_modules/bootstrap/scss/**/*.scss')
        .pipe(dest('./wwwroot/css/src/vendor/bootstrap'));

const copyBootstrapIcons = () =>
    src('./node_modules/bootstrap-icons/font/**/*.{css,woff,woff2}')
        .pipe(dest('./wwwroot/css/dist'));

const compileSass = () =>
    src('./wwwroot/css/src/main.scss')
        .pipe(sass(scssOptions).on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(dest('./wwwroot/css/dist'));

const watchScss = () =>
    watch('./wwwroot/css/src/**/main.scss', series(compileSass));

module.exports = {
    'build': series(copyBootstrapSource, copyBootstrapIcons, compileSass),
    'copy-bootstrap-sources': series(copyBootstrapSource, copyBootstrapIcons),
    'watch-scss': watchScss
};
