var myApp = angular.module('myApp', ['ngRoute']);

myApp.factory("loginStatus", function(){

    var loginStatus = false;
    var username = null;

    function setLoggedIn(){
        loginStatus = true;
    }

    function setUsername(user){
        username = user;
    }

    function getUsername(){
        return username;
    }

    function isLoggedIn(){
        return loginStatus;
    }

    function clearLoginStatus(){
        loginStatus = false;
        username = null;
    }

    return {
        setLoggedIn         : setLoggedIn,
        setUsername         : setUsername,
        getUsername         : getUsername,
        isLoggedIn          : isLoggedIn,
        clearLoginStatus    : clearLoginStatus
    }

});