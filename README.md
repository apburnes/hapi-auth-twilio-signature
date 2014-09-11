hapi-auth-twilio-signature
==========================

A [hapi.js](http://hapijs.com/) authentication plugin for [Twilio](https://www.twilio.com)

##About

Use this authentication plugin for Twilio's webhooks to authenticate requests coming from Twilio
[https://www.twilio.com/platform/webhooks](https://www.twilio.com/platform/webhooks).  This plugin will intercept
the "X-Twilio-Signature" header token to be validated in the route.

##Usage

Twilio Signature authentication requires validating the "X-Twilio-Signature" header token. The `'twilio-signature'` scheme takes the following options:

- `validateFunc` - (required) a twilio signature token validation function: `function(signature, callback)` where:
    - `signature` - a header signature sent from twilio via "X-Twilio-Signature"
    - `callback` - a callback function: `function(err, isValid, credentials)` where:
        - `err` - an internal error.
        - `isValid` - `true` if the token is valid, otherwise `false`.
        - `credentials` - a credentials object passed back to the application in `request.auth.credentials`. Typically, `credentials` are only
          included when `isValid` is `true`, but there are cases when the application needs to know who tried to authenticate even when it fails

```js
var twilio = require('twilio');

var token = 'YOUR_TWILIO_AUTH_TOKEN';

var validate = function (signature, callback) {

    if (!signature) {
        return callback(null, false);
    }

    var credentials = twilio.validateRequest(token, signature, url, params);

    if (twilio.validateRequest(token, signature, 'example.com', 'webhooks')) {
    	callback(null, true, credentials);
    }
};

server.pack.register(require('hapi-auth-twilio-signature'), function (err) {
    server.auth.strategy('twilio', 'twilio-signature', { validateFunc: validate });
    server.route({ method: 'POST', path: '/webhooks', config: { auth: 'twilio' } });
});
```

