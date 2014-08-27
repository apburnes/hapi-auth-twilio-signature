'use strict';

var boom = require('boom');
var hoek = require('hoek');

function scheme(server, options){
  hoek.assert(options, 'Missing header "X-Twilio-Signature" for authentication.');
  hoek.assert(typeof options.validateFunc === 'function', 'options.validateFunc must be a function to validate authentication.');

  var twilioSignature = options.twilioSignature || 'x-twilio-signature';
  var validateFunc = options.validateFunc;

  function authenticate(request, reply){
    var signature = request.headers[twilioSignature];

    if(!signature){
      return reply(boom.badRequest('X-Twilio-Signature is not set', 'Twilio-Signature'));
    }

    validateFunc(signature, function(err, isValid, credentials){
      credentials = credentials || null;

      if(err){
        return reply(err, {
          credentials: credentials,
          log: {
            data: err,
            tags: ['auth', 'Twilio-Signature']
          }
        });
      }

      if(!isValid){
        return reply(boom.unauthorized('Invalid "X-Twilio-Signature".'), {
          credentials: credentials,
          log: {
            tags: ['auth', 'invalid']
          }
        });
      }

      if(!credentials){
        return reply(boom.badImplementation('Credentials must be sent to validate authentication.'), {
          log: {
            tags: 'credentials'
          }
        });
      }

      return reply(null, {
        credentials: credentials
      });
    });
  }

  return {
    authenticate: authenticate
  };
}

function register(server, options, next){
  server.auth.scheme('twilio-signature', scheme);
  next();
}

register.attributes = {
  pkg: require('./package.json')
};

module.exports = {
  register: register
};
