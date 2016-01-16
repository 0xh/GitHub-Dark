module.exports = function(grunt) {
  'use strict';

  var config, getTheme, file;

  try {
    config = grunt.file.readJSON('build.json');
  } catch (err) {
    console.info('build.json not found - using defaults');
    config = {
      'theme'    : 'Twilight',
      'color'    : '#4183C4',
      'font'     : 'Menlo',
      'image'    : 'url(https://raw.githubusercontent.com/StylishThemes/GitHub-Dark/master/images/backgrounds/bg-tile1.png)',
      'tiled'    : true,
      'codeWrap' : true,
      'attach'   : 'scroll',
      'tab'      : 4,
      'webkit'   : false
    };
  }

  getTheme = function() {
    return (config.theme || '').toLowerCase().replace(/\s+/g, '-');
  };

  // ** set up build options **
  config.sourceFile = 'github-dark.css';
  file = getTheme();
  // setting "ace" to an empty string, or "default" will leave the default GitHub-base16 theme in place, with a dark background
  // using theme src files until we can figure out why cssmin is removing 2/3 of the definitions - see #240
  config.themeFile = file === '' || file === 'default' ? '' : 'themes/' + file + '.min.css';
  // build file name
  config.buildFile = 'github-dark-' + (file || 'default') + '-' + config.color.replace(/[^\d\w]/g, '') + '.build.min.css';
  // background options
  config.bgOptions = config.tiled ?
    'background-repeat: repeat !important; background-size: auto !important; background-position: left top !important;' :
    'background-repeat: no-repeat !important; background-size: cover !important; background-position: center top !important;';
  config.bgAttachment = config.attach.toLowerCase() === 'scroll' ? 'scroll' : 'fixed';

  config.codeWrapCss = config.codeWrap ?  [
    '/* GitHub Bug: Enable wrapping of long code lines */',
    '  body:not(.nowrap) .blob-code-inner,',
    '  body:not(.nowrap) .markdown-body pre > code,',
    '  body:not(.nowrap) .markdown-body .highlight > pre {',
    '    white-space: pre-wrap !important;',
    '    word-break: break-all !important;',
    '    display: block !important;',
    '  }',
    '  body:not(.nowrap) td.blob-code-inner {',
    '    display: table-cell !important;',
    '  }'
  ].join('\n') : '';

  // Don't include closing bracket for a chrome build
  config.newTheme = config.themeFile ? '<%= grunt.file.read("' + config.themeFile + '") %>' : '';

  // get @-moz prefix
  file = grunt.file.read('github-dark.css').match(/(@-moz-document regexp\((.*)+\) \{(\n|\r)+)/);
  config.prefix = file && file.length ? file[1].replace(/^\s+|\s+$/g, '') : '';

  // custom build
  config.replacements = [{
    pattern: /@-moz-document regexp\((.*)\) \{(\n|\r)+/,
    replacement: ''
  }, {
    pattern: /\/\*\[\[bg-choice\]\]\*\/ url\(.*\)/,
    replacement: config.image
  }, {
    pattern: '/*[[bg-options]]*/',
    replacement: config.bgOptions
  }, {
    pattern: '/*[[bg-attachment]]*/ fixed',
    replacement: config.bgAttachment
  }, {
    pattern: /\/\*\[\[base-color\]\]\*\/ #\w{3,6}/g,
    replacement: config.color
  }, {
    pattern: '/*[[font-choice]]*/',
    replacement: config.font
  }, {
    pattern: '/*[[code-wrap]]*/',
    replacement: config.codeWrapCss
  }, {
    pattern: /\/\*\[\[tab-size\]\]\*\/ \d+/g,
    replacement: config.tab
  }, {
    // remove default syntax themes AND closing bracket
    pattern: /\s+\/\* grunt build - remove to end of file(.*(\n|\r))+\}$/m,
    replacement: ''
  }, {
    // remove blocks of code
    pattern: /\s+\/\* grunt-remove-block-below (.*(\n|\r))+\s+\/\* grunt-remove-block-above \*\//gm,
    replacement: ''
  }, {
    // add selected theme
    pattern: '/*[[syntax-theme]]*/',
    replacement: config.newTheme
  }];

  // userstyles.org - remove defaults & leave placeholders
  config.replacements_user = [{
    pattern: /@-moz-document regexp\((.*)\) \{(\n|\r)+/,
    replacement: ''
  }, {
    pattern: /\/\*\[\[bg-choice\]\]\*\/ url\(.*\)/,
    replacement: '/*[[bg-choice]]*/'
  }, {
    pattern: '/*[[bg-attachment]]*/ fixed',
    replacement: '/*[[bg-attachment]]*/'
  }, {
    pattern: /\/\*\[\[base-color\]\]\*\/ #\w{3,6}/g,
    replacement: '/*[[base-color]]*/'
  }, {
    pattern: /\/\*\[\[tab-size\]\]\*\/ \d+/g,
    replacement: '/*[[tab-size]]*/'
  }, {
    // remove blocks of code
    pattern: /\s+\/\* grunt-remove-block-below (.*(\n|\r))+\s+\/\* grunt-remove-block-above \*\//gm,
    replacement: ''
  }, {
    // remove default syntax theme AND closing bracket
    pattern: /\s+\/\* grunt build - remove to end of file(.*(\n|\r))+\}$/m,
    replacement: ''
  }];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    config: config,

    'string-replace': {
      inline: {
        files: {'<%= config.buildFile %>' : '<%= config.sourceFile %>'},
        options: {replacements: '<%= config.replacements %>'}
      },
      mark: {
        files: {'<%= config.buildFile %>' : '<%= config.buildFile %>'},
        options: {
          replacements: [
            {pattern: /\/\*\[\[/gm, replacement: '/*![['},
            {pattern: '/* AGENT_SHEET */', replacement: '/*! AGENT_SHEET */'}
          ]
        }
      },
      unmark: {
        files: {'<%= config.buildFile %>' : '<%= config.buildFile %>'},
        options: {
          replacements: [
            {pattern: /\/\*\!\[\[/gm, replacement: '/*[['},
            {pattern: '/*! AGENT_SHEET */', replacement: '/* AGENT_SHEET */'}
          ]
        }
      },
      fix: {
        files: {'<%= config.buildFile %>' : '<%= config.buildFile %>'},
        options: {replacements: [{pattern: /\;\:\/\*\[\[/gm, replacement: ';/*[['}]}
      },
      afterCleanCss: {
        files: {'<%= config.buildFile %>' : '<%= config.buildFile %>'},
        options: {replacements: [{pattern: /__ESCAPED_SOURCE_END_CLEAN_CSS__/g, replacement: ''}]}
      },
      afterPerfectionist: {
        files: {'<%= config.sourceFile %>' : '<%= config.sourceFile %>'},
        options: {
          replacements: [
            {pattern: /\{\/\*\!/g, replacement: '{\n /*!'},
            {pattern: /\/\* /g, replacement: '\n  /* '},
            {pattern: /(\s+)?\n(\s+)?\n/gm, replacement: '\n'},
            {pattern: / {2}}\/\*/gm, replacement: '  }\n  /*'},
          ]
        }
      }
    },
    clean: {
      themes: {
        src: ['themes/*.min.css']
      }
    },
    exec: {
      // --maxSelectorLength 80 (default)
      // --maxAtRuleLength 250 is used to keep the @-moz-document rule all on one line
      perfectionist: 'node_modules/.bin/perfectionist github-dark.css --indentSize 2 --maxAtRuleLength 250',
      stylelint: 'node_modules/.bin/stylelint github-dark.css themes/src/*.css',
    },
    cssmin: {
      minify: {
        files: {'<%= config.buildFile %>' : '<%= config.buildFile %>'},
        options: {
          keepSpecialComments: '*',
          advanced: false
        }
      },
      themes: {
        files: [{
          expand : true,
          cwd : 'themes/src/',
          src : '*.css',
          dest : 'themes/',
          ext : '.min.css'
        }],
        options: {
          keepSpecialComments: '*',
          advanced: false
        }
      }
    },
    wrap: {
      mozrule: {
        files: {'<%= config.buildFile %>' : '<%= config.buildFile %>'},
        options: {
          wrapper: ['<%= config.prefix %>', '}']
        }
      }
    },
    watch: {
      css: {files: ['github-dark.css']}
    }
  });

  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-wrap');
  grunt.loadNpmTasks('grunt-exec');

  // build custom GitHub-Dark style using build.json settings
  grunt.registerTask('default', 'Building custom style', function() {
    config.buildFile = config.buildFile.replace('.min.css', '.css');
    grunt.task.run(['string-replace:inline']);
    if (!(config.chrome || config.webkit)) {
      grunt.task.run(['wrap']);
    }
  });

  // build custom minified GitHub-Dark style
  grunt.registerTask('minify', 'Building custom minified style', function() {
    grunt.task.run(['string-replace:inline', 'cssmin:minify']);
    if (!(config.chrome || config.webkit)) {
      grunt.task.run(['wrap']);
    }
  });

  // build userstyle for pasting into https://userstyles.org/styles/37035/github-dark
  grunt.registerTask('user', 'building userstyles.org file', function() {
    config.buildFile = 'github-dark-userstyle.build.css';
    config.replacements = config.replacements_user;
    grunt.task.run([
      'string-replace:inline',
      'wrap'
    ]);
  });
  grunt.registerTask('usermin', 'building userstyles.org file', function() {
    config.buildFile = 'github-dark-userstyle.build.css';
    config.replacements = config.replacements_user;
    grunt.task.run([
      'string-replace:inline',
      'string-replace:mark',
      'cssmin:minify',
      'string-replace:afterCleanCss',
      'string-replace:unmark',
      'string-replace:fix',
      'wrap'
    ]);
  });

  // build custom minified GitHub-Dark style
  grunt.registerTask('themes', 'Rebuild minified theme files', function() {
    grunt.task.run([
      'format',
      'cssmin:themes'
    ]);
  });

  // auto-format github-dark.css
  grunt.registerTask('format', 'Format CSS', function() {
    grunt.task.run(['exec:perfectionist', 'string-replace:afterPerfectionist']);
  });

  // lint github-dark.css and themes for errors
  grunt.registerTask('lint', 'Lint CSS for style errors', function() {
    grunt.task.run(['exec:stylelint']);
  });

  // watch thingy
  grunt.registerTask('dev', ['watch']);
};
