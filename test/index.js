'use strict';

var chai = require('chai');
var expect = chai.expect;

var hapi = require('hapi');
var boom = require('boom');
var extend = require('util')._extend;

var authTwilioSignature = require('../');

describe('Auth Twilio Signature', function(){

  function validateFunc(signature, callback){
    if (signature === 'validSignature') {
      var credentials = {
        twilioSignature: signature
      };

      return callback(null, true, credentials);
    }
    if (signature === 'noCredentials') {
      return callback(null, true);
    }
    if (signature === 'error') {
      return callback(boom.unauthorized());
    }

    return callback(null, false);
  }

  function basicHandler(request, reply){
    reply('ok');
  }

  var request;
  var server = new hapi.Server({debug: false});

  before(function(done){
    server.pack.register(authTwilioSignature, function(err){

      server.auth.strategy('signature', 'twilio-signature', { validateFunc: validateFunc });

      server.route([
        { method: 'POST', path: '/auth', handler: basicHandler, config: { auth: 'signature' } }
      ]);

      done(err);
    });
  });

  beforeEach(function(){
    request = {
      method: 'POST',
      url: '/auth',
    };
  });

  afterEach(function(){
    request = null;
  });

  it('should return a successful 200 auth', function(done){
    extend(request, {
      headers: {
        'X-Twilio-Signature': 'validSignature'
      }
    });

    server.inject(request, function(res){
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.be.equal('ok');
      done();
    });
  });

  it('should return a 401 unauthorized with incorrect signature', function(done){
    extend(request, {
      headers: {
        'X-Twilio-Signature': 'notaSignature'
      }
    });

    server.inject(request, function(res){
      expect(res.statusCode).to.equal(401);
      done();
    });
  });

  it('should return a 401 unauthorized when validateFunc sends error', function(done){
    extend(request, {
      headers: {
        'X-Twilio-Signature': 'error'
      }
    });

    server.inject(request, function(res){
      expect(res.statusCode).to.equal(401);
      done();
    });
  });

  it('should return a 500 bad implemtation when credentials are not sent', function(done){
    extend(request, {
      headers: {
        'X-Twilio-Signature': 'noCredentials'
      }
    });

    server.inject(request, function(res){
      expect(res.statusCode).to.equal(500);
      done();
    });
  });

  it('should return a 400 unauthorized with missing signature', function(done){
    server.inject(request, function(res){
      expect(res.statusCode).to.equal(400);
      done();
    });
  });
});
