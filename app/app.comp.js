(function () {
    'use strict';
    var module = angular.module('app')
        .component('appComponent', {
            templateUrl: 'app/app.html',
            controller: ['$cookies','ngDialog', controller],
            controllerAs: 'model'
        })

    function controller($cookies, ngDialog) {
        var model = this;
        var unirest = require('unirest');
        var firstTime = $cookies.get('firstTime');
        var globalResponseID;
        model.policeCalled = false;

        if (firstTime != 'firstTime'){
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

            var userInfo = {
                'name': user.name,
                'phone': user.phone,
                'location': {
                    'latitude': user.latitude,
                    'longitude': user.longitude
                },
                'pin': user.pin
            }

            $cookies.putObject('userInfo', userInfo);
            model.userStored = true;
            setTimeout(function(){
                location.reload();
            },500)
        }

    }
}());
