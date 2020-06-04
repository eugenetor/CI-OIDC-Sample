var request = require('request');
var express = require('express');
var router = express.Router();
var OIDC_BASE_URI = process.env.OIDC_CI_BASE_URI;

//Added by Eugene. This function is building SSO URL for BigCommerce SSO--------
var clientId = process.env.BC_CLIENT_ID;
var clientSecret = process.env.BC_CLIENT_SECRET
var storeHash = process.env.BC_STORE_HASH ;
var storeUrl = process.env.BC_STORE_URL;
//const customerId = "2";

const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');

function getLoginUrl(customerId, storeHash, storeUrl, clientId, clientSecret) {
   const dateCreated = Math. round((new Date()). getTime() / 1000);
   const  payload = {
       "iss": clientId,
       "iat": dateCreated,
       "jti": uuidv4(),
       "operation": "customer_login",
       "store_hash": storeHash,
       "customer_id": customerId,
   }
   let token = jwt.sign(payload, clientSecret, {algorithm:'HS256'});
   return `${storeUrl}/login/token/${token}`
}

// End of Eugene's addition-----------------------------------------------------

// GET homepage
router.get('/', function(req, res, next) {

  if(req.session.accessToken){
    // Log the user profile
    console.log(req.user);
    // Added by Eugene - call to loginUrl function that builds SSO URL for BigCommerce store.
    var bigCommerceAttr = req.user._json.bigCommerce;
    //Log the bigCommerce attribute value
    console.log(bigCommerceAttr);
    const loginUrl = getLoginUrl(bigCommerceAttr, storeHash, storeUrl, clientId, clientSecret);
    //Log the BigCommerce SSO URL
    console.log(loginUrl);
    res.render('users', {
      title: 'Users',
      user: req.user,
      loggedin: (req.query.loggedin == 'success') ? true : false,
      bigCommerceUrl: loginUrl
    });
  }
  else{
    // If no session exists, show the index.hbs page
    res.render('index', {
    title: 'IBM Cloud Identity OpenID Connect Example',
    loggedout: (req.query.loggedout == 'success') ? true : false
  });
  }
});
//Go to BigCommerce SSO
router.get('/bigCommerceUrl', function(req, res, next) {

  if(req.session.accessToken){
    // Log the user profile
    console.log(req.user);
    // Added by Eugene - call to loginUrl function that builds SSO URL for BigCommerce store.
    var bigCommerceAttr = req.user._json.bigCommerce;
    //Log the bigCommerce attribute value
    console.log(bigCommerceAttr);
    const loginUrl = getLoginUrl(bigCommerceAttr, storeHash, storeUrl, clientId, clientSecret);
    //Log the BigCommerce SSO URL
    console.log(loginUrl);
    res.redirect(302,loginUrl)
  }
  else{
    // If no session exists, show the index.hbs page
    res.render('index', {
    title: 'IBM Cloud Identity OpenID Connect Example',
    loggedout: (req.query.loggedout == 'success') ? true : false
  });
  }
});
// GET profile
router.get('/profile', function(req, res, next) {

  request.get(`${OIDC_BASE_URI}/userinfo`, {
    'auth': {
      'bearer': req.session.accessToken
    }
  },function(err, response, body){

    console.log('User Info')
    console.log(body);

    pbody = JSON.parse(body);
    vbody = JSON.stringify(pbody, null, 2);

    res.render('profile', {
      title: 'Profile',
      user: pbody,
      fullJson: vbody
    });
  });
});

router.get('/introspect', function(req, res, next) {

  request.post(`${OIDC_BASE_URI}/introspect`, {
    'form': {
      'client_id': process.env.OIDC_CLIENT_ID,
      'client_secret': process.env.OIDC_CLIENT_SECRET,
      'token': req.session.accessToken,
      'token_type_hint': 'access_token'
      }
    },function(err, response, body){

    console.log('Introspect output')
    console.log(body);

    pbody = JSON.parse(body);
    vbody = JSON.stringify(pbody, null, 2);

    res.render('introspect', {
      title: 'Introspect',
      atoken: req.session.accessToken,
      introspect: pbody,
      fullJson: vbody
    });
  });
});

module.exports = router;
