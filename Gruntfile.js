module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    smoosher: {
      all: {
        files: {
          'WillMarquardt.html': 'resume.html'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-html-smoosher-install-fix');
  grunt.registerTask('default', ['smoosher']);
}