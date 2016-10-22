(function () {
    'use strict';
    var module = angular.module('app')
        .component('appComponent', {
            templateUrl: 'app/app.html',
            controller: ['$cookies','ngDialog', '$timeout', controller],
            controllerAs: 'model'
        })

    function controller($cookies, ngDialog, $timeout) {
        var model = this;
        
        // We use unirest to post to the SendPolice API
        var unirest = require('unirest');
        
        // Set our "First Time Cookie"
        var firstTime = $cookies.get('firstTime');
        
        //Set our globalResponseID in case of cancellation 
        var globalResponseID;
        
        // Police called = false for shield view
        model.policeCalled = false;

        // Set our empty user object
        model.user = {
            'name': '',
            'phone': '',
            'location': {
                'latitude': '',
                'longitude': ''
            },
            address: '',
            city: '',
            state: '',
            pin: ''
        };

        // If the user doesnt have a "first time" cookie, set them up
        if (firstTime != 'firstTime') {
            model.firstTime = true;
            // See if they have a userInfo cookie
            var user = $cookies.getObject('userInfo');

            // If so, readd the firstTime cookie and go to home
            if (user != null){
                    $cookies.put('firstTime', 'firstTime');
                    model.firstTime = false;
                    model.user = $cookies.getObject('userInfo');
                }
        }
        // If the user does have a firstTime cookie
        else{
            // Fetch the userInfo cookie
            var user = $cookies.getObject('userInfo');

            // If there is no userInfo cookie, set them up again
            if (user == null){
                $cookies.put('firstTime', 'firstTime');
                model.firstTime = true;
            }
            // If there is, set their user cookie to the user model
            else{
                model.firstTime = false;
                model.user = $cookies.getObject('userInfo');
            }
        }            
        var mytimeout;
        
        // Panic Clicked Method
        model.panicClicked = function(){
            // Grab the user cookie
            var user = $cookies.getObject('userInfo');
            
            // What we are sending to the API
            console.log(user);
            
            // Set called police = true to display the 'X' to cancel
            model.policeCalled = true;
            
            // Call the API to send the Police
            sendPolice(user);
            
            // Start Timer for cancellation
            model.countDown = 10
            model.onTimeout = function(){
                if (model.countDown > 0) {
                    mytimeout = $timeout(model.onTimeout,1000);
                    model.countDown--;
                }
                else {
                    model.cancelDisabled = true;
                }
            }
            mytimeout = $timeout(model.onTimeout,1000);
            
        }
        
        function sendPolice(user){
            // Set the POST body to the userInfo cookie data
            var body = {
                name: user.name,
                phone: user.phone,
                location: {
                    lat: user.location.latitude,
                    lon: user.location.longitude,
                    accuracy: 5
                },
                pin: user.pin,
            }

            // POST the userInfo data
            unirest.post('https://sandbox.sendpolice.com/v1/alerts?user_key=ffee1740f8f9a955a9157900227014e8')
                .type('json')
                .send(body)
                .end(function (response) {
                    var sendResponseID = response.raw_body._id;
                    // If we get a response, store the ID globally
                    if(sendResponseID != null){
                        globalResponseID = sendResponseID;
                        console.log("Requested ID: "+ globalResponseID);
                    }
                    // Something happened with the POST, alert and set to policeCalled to false
                    else {
                        alert("Police Request Failed, Please Try Again!");
                        model.policeCalled = false;
                    }
               });
        }
        
        function resetTimer(){
            $timeout.cancel(mytimeout);
            model.countDown = 10;
        }

        // Cancel Panic Method
        model.cancelPanic = function() {
            // Grab the userInfo Cookie
            var user = $cookies.getObject('userInfo');
            
            // Prompt the user to enter their pin
            var pin = prompt("Please Enter Your Pin");

            // If Pin is incorrect, dont cancel
            if (pin != user.pin) {
                alert("Pin Authentication Failed!")
            }
            else{   
                resetTimer();
                cancelPolice();
                
                // Finaly, remove the "Cancel Police" view and go back to the shield view
                model.policeCalled = false;
            }
        }
        
        function cancelPolice(){
                // Set the body status to 2 (Cancel)
                var body = {
                    status: 2
                };

                // POST the response id with the cancel status
                unirest.post('https://sandbox.sendpolice.com/v1/alerts/' + globalResponseID + '/statuses?user_key=ffee1740f8f9a955a9157900227014e8')
                    .type('json')
                    .send(body)
                    .end(function (response) {
                    var cancelResponseID = response.raw_body._id;
                    if (cancelResponseID == null) {
                        alert("Request Failed, Please Try Again!");
                        console.log(cancelResponseID);
                    } else {
                        alert("Police Cancelled!");
                        console.log("Cancelled ID: " + cancelResponseID);
                    }
                });
        }

        // If first time, collect user data and store as a cookie
        model.submitUserInfo = function(user){
            // Google API specific address format
            // Exp: "123+Easy+Street+North"
            var streetAdress = user.address;
            var streetAddressSplit = streetAdress.split(" ")
            var streetAddressFixed = streetAddressSplit.join("+");
            var city = user.city;
            var state = user.state;
            
            // Format it all together
            var apiAddress = streetAddressFixed + "+" + city + "+" + state;

            // Use Google reverse geocoder to get latitude and longitude from physical address
            unirest.post('https://maps.googleapis.com/maps/api/geocode/json?address='+ apiAddress + '&key=AIzaSyA4fRk6sfUIYmjIG4rRL3SAF4eALmw1lqM')
                .end(function (response) {
                var geolocation = response.body.results[0].geometry.location;
                var latitude = geolocation.lat;
                var longitude = geolocation.lng;
                console.log("Lat: " + latitude + "\nLong: " + longitude);
                
                createCookie(user, latitude, longitude)
            });
        }
        
        function createCookie(user, latitude, longitude){
            // Store all user data in an object
            var userInfo = {
                name: user.name,
                phone: user.phone,
                location: {
                    latitude: latitude,
                    longitude: longitude
                },
                address: user.address,
                city: user.city,
                state: user.state,
                pin: user.pin
            }

            // Save the userInfo object as a cookie
            $cookies.putObject('userInfo', userInfo);
            model.userStored = true;
            
            console.log($cookies.getObject('userInfo'));
            
            // Workaround to reload the view after saving the cookie
            setTimeout(function(){
                location.reload();
            }, 500)
        }
    }
}());
