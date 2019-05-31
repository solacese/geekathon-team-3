
//Our routing rules go here

myApp.config( function($routeProvider){
    
    $routeProvider

    .when('/login', {
        templateUrl: 'login/login.html',
        controller: 'loginController'
    })

    .when('/', {
        templateUrl: 'main/main.html',
        controller: 'mainController'
    });

});
