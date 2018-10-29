const gulp = require('gulp');
const del = require('del');
const runSequence = require('run-sequence');
const gulpLoadPlugins = require('gulp-load-plugins');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const pxtounits = require('postcss-px2units');
const changed = require('gulp-changed');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const cssBase64 = require('gulp-css-base64');

const $ = gulpLoadPlugins();

// Dir config
const paths = {
  src: {
    baseDir: './src',
    scriptsDir: './src/**/*.js',
    viewsDir: './src/**/*.{html,wxml}',
    wxssDir: './src/**/*.wxss',
    jsonDir: './src/**/*.json',
    imagesDir: './src/**/*.{png,jpg,jpeg,svg}',
    sassDir: './src/**/*.{scss,sass}'
  },
  ignore: {
    sassDir: '!./src/assets/**/*.{scss,sass}',
    imagesDir: '!./src/assets/images/base64/*.{png,jpg,jpeg,svg}'
  },
  dist: {
    baseDir: './dist'
  }
};

// Copy all files at the root level (app)
gulp.task('copy', () =>
  gulp.src([
    'src/**',
    '!src/cdn',
    '!src/**/*.scss'
  ], {
    dot: true
  })
  .pipe(changed('dist', {}))
  .pipe(gulp.dest('dist'))
  .pipe($.size({
    title: 'copy'
  }))
);

// dev image
gulp.task('images:dev', () => {
  return gulp.src([
      paths.src.imagesDir,
      paths.ignore.imagesDir
    ])
    // .pipe(imagemin())
    .pipe(gulp.dest(paths.dist.baseDir))
})

// build image
gulp.task('images:build', () => {
  return gulp.src([
      paths.src.imagesDir,
      paths.ignore.imagesDir
    ])
    .pipe(imagemin())
    .pipe(gulp.dest(paths.dist.baseDir))
});

// dev JSON
gulp.task('json:dev', () => {
  return gulp.src(paths.src.jsonDir)
    .pipe(gulp.dest(paths.dist.baseDir))
})

// build JSON
gulp.task('json:build', () => {
  return gulp.src(paths.src.jsonDir)
    // .pipe(jsonminify())
    .pipe(gulp.dest(paths.dist.baseDir))
})

// dev wxss
gulp.task('wxss:dev', () => {
  return gulp.src(paths.src.wxssDir)
    .pipe(gulp.dest(paths.dist.baseDir))
})

// build wxss
gulp.task('wxss:build', () => {
  return gulp.src(paths.src.wxssDir)
    .pipe(gulp.dest(paths.dist.baseDir))
})

// dev views
gulp.task('views:dev', () => {
  return gulp.src(paths.src.viewsDir)
    .pipe(gulp.dest(paths.dist.baseDir))
})

// build views
gulp.task('views:build', () => {
  return gulp.src(paths.src.viewsDir)
    // .pipe(htmlmin({
    //   collapseWhitespace: true,
    //   removeComments: true,
    //   keepClosingSlash: true
    // })) 
    // 压缩完之后有一点问题 待考究
    .pipe(gulp.dest(paths.dist.baseDir))
})

// dev sass -> wxss px->rpx
gulp.task('sass:dev', () => {
  return gulp.src([
      paths.src.sassDir,
      paths.ignore.sassDir
    ])
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(postcss([pxtounits()]))
    .pipe(rename(function (path) {
      path.extname = ".wxss";
    }))
    .pipe(cssBase64())
    .pipe(gulp.dest(paths.dist.baseDir))
});

// build sass -> wxss px->rpx
gulp.task('sass:build', () => {
  return gulp.src([
      paths.src.sassDir,
      paths.ignore.sassDir
    ])
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(postcss([pxtounits()]))
    .pipe(rename(function (path) {
      path.extname = ".wxss";
    }))
    .pipe(cssBase64())
    .pipe(gulp.dest(paths.dist.baseDir))
});

// dev js 
gulp.task('scripts:dev', () => {
  return gulp.src([
      paths.src.scriptsDir
    ])
    // .pipe(babel({
    //   presets: ['es2015']
    // }))
    .pipe(gulp.dest(paths.dist.baseDir))
});

// build js
gulp.task('scripts:build', () => {
  return gulp.src([
      paths.src.scriptsDir
    ])
    // .pipe(babel({
    //   presets: ['es2015']
    // }))
    // .pipe(uglify({
    //   compress: true
    // }))
    .pipe(gulp.dest(paths.dist.baseDir))
});

gulp.task('dev', ['scripts:dev', 'wxss:dev', 'sass:dev', 'views:dev', 'json:dev', 'images:dev'], () => {
  gulp.watch(paths.src.scriptsDir, ['scripts:dev'])
  gulp.watch(paths.src.sassDir, ['sass:dev'])
  gulp.watch(paths.src.wxssDir, ['wxss:dev'])
  gulp.watch(paths.src.viewsDir, ['views:dev'])
  gulp.watch(paths.src.jsonDir, ['json:dev'])
  gulp.watch(paths.src.imagesDir, ['images:dev'])
})

//在命令行执行：gulp watch，就可实现监听文件变化来自动编译
// gulp.task('dev', function () {
//   gulp.watch('src/**/*.*', ['default']);
// });

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist', '!dist/.git'], {
  dot: true
}));

// Build production files, the default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    // 'copy',
    'images:build',
    'scripts:build',
    'wxss:build',
    'sass:build',
    'json:build',
    'views:build',
    cb
  )
);
