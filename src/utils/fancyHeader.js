'use strict';

const cfonts = require('cfonts');

module.exports = {
  printFancyHeader: function() {
    cfonts.say('PM2 RTB UI', {
      font: 'block',
      space: false,
    })

    console.log('PM2 Real-time Web UI')
    console.log('Created by: Miłosz Gilga <https://miloszgilga.pl>')
    console.log('On Apache-2.0 license\n')
  }
}
