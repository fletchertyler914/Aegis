var steemAuth = require('./lib/steemauth');

var username = process.env.STEEM_USERNAME;
var password = process.env.STEEM_PASSWORD;
var pubWif = process.env.STEEM_POSTING_PUBLIC_WIF;
var privWif = process.env.STEEM_POSTING_PRIVATE_WIF;

var isValid = steemAuth.verify(username, password, {posting: [[pubWif, 1]]});
console.log(isValid);

var isWif = steemAuth.isWif(privWif);
console.log(isWif);

var toWif = steemAuth.toWif(username, password, 'posting');
console.log(toWif);

var wifIsValid = steemAuth.wifIsValid(privWif, pubWif);
console.log(wifIsValid);