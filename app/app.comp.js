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
        var unirest = require('unirest');
        var firstTime = $cookies.get('firstTime');
        var globalResponseID;
        model.policeCalled = false;

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

        if (firstTime != 'firstTime') {
            model.firstTime = true;

            var user = $cookies.getObject('userInfo');

            if (user != null){
                    $cookies.put('firstTime', 'firstTime');
                    model.firstTime = false;
                    model.user = $cookies.getObject('userInfo');
                }
        }
        else{
            var user = $cookies.getObject('userInfo');

            if (user == null){
                $cookies.put('firstTime', 'firstTime');
                model.firstTime = true;
            }
            else{
                model.firstTime = false;
                model.user = $cookies.getObject('userInfo');
            }
        }

        if ("geolocation" in navigator) {
            /* geolocation is available */
            var lat, long;
            navigator.geolocation.getCurrentPosition(function(position) {
                console.log(position.coords.latitude, position.coords.longitude);
                lat = position.coords.latitude;
                long = position.coords.longitude;
                
                getAddressFromGeolocation(lat, long, setUserLocation);
            });
        }
        
        
        function getAddressFromGeolocation (lat, lng, callback){
                unirest.post('https://maps.googleapis.com/maps/api/geocode/json?latlng='+ lat +','+ lng +'&key=AIzaSyA4fRk6sfUIYmjIG4rRL3SAF4eALmw1lqM')
                    .end(function (response) {

                    var streetNumber =  response.body.results[0].address_components[0].short_name; // Number
                    var streetName =  response.body.results[0].address_components[1].short_name; // Name
                    var fullAddress = streetNumber + " " + streetName; // Number & Name
                    var city = response.body.results[0].address_components[2].short_name; // City
                    var state = response.body.results[0].address_components[4].short_name; // State

                    callback(fullAddress, city, state);
                });
        }
        
        function setUserLocation(fullAddress, city, state){
            $timeout(function(){
                model.user.address = fullAddress;
                model.user.city = city;
                model.user.state = state;
                console.log(model.user);
            }, 500)

        }

        model.panicClicked = function(){
            var user = $cookies.getObject('userInfo');
            model.policeCalled = true;

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

            unirest.post('https://sandbox.sendpolice.com/v1/alerts?user_key=ffee1740f8f9a955a9157900227014e8')
                .type('json')
                .send(body)
                .end(function (response) {
                var sendResponseID = response.raw_body._id;
                if(sendResponseID != null){
                    globalResponseID = sendResponseID;
                    console.log("Global Response ID: "+ globalResponseID);
                }
           });
        }

        model.cancelPanic = function() {
            var user = $cookies.getObject('userInfo');
            var pin = prompt("Please enter your pin", "");

            if (pin != user.pin) {
                alert("PIN INCORRECT!");
            }
            else{
                var body = {
                    status: 2
                };

                unirest.post('https://sandbox.sendpolice.com/v1/alerts/' + globalResponseID + '/statuses?user_key=ffee1740f8f9a955a9157900227014e8')
                    .type('json')
                    .send(body)
                    .end(function (response) {
                    var cancelResponseID = response.raw_body._id;
                    console.log(cancelResponseID);
                    if (cancelResponseID == null) {
                        alert("Something Went Wrong");
                    } else {
                        alert("Police Cancelled");
                    }
                });

                model.policeCalled = false;
            }
        }

        model.submitUserInfo = function(user){
            var streetAdress = user.address;
            var streetAddressSplit = streetAdress.split(" ")
            var streetAddressFixed = streetAddressSplit.join("+");
            var city = user.city;
            var state = user.state;

            unirest.post('https://maps.googleapis.com/maps/api/geocode/json?address='+ streetAddressFixed + '&key=AIzaSyA4fRk6sfUIYmjIG4rRL3SAF4eALmw1lqM')
                .end(function (response) {
                var geolocation = response.body.results[0].geometry.location;
                user.latitude = geolocation.lat;
                user.longitude = geolocation.lng;
                console.log("Lat: " + user.latitude + "\nLong: " + user.longitude);
            });

            var userInfo = {
                name: user.name,
                phone: user.phone,
                location: {
                    latitude: user.latitude,
                    longitude: user.longitude
                },
                address: user.address,
                city: user.city,
                state: user.state,
                pin: user.pin
            }

            $cookies.putObject('userInfo', userInfo);
            model.userStored = true;
            setTimeout(function(){
                location.reload();
            },500)
        }
    }
}());
