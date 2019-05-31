myApp.controller('loginController', ['$scope', '$window', 'loginStatus', function($scope,  $window, loginStatus) {
    $scope.pageName = 'Login Page';
    console.log("In Login page!");

    console.log("Login Status:"+loginStatus.isLoggedIn());


    $scope.scanQr = function(){

        console.log("QR Code scanned!!");

        console.log("In function to login via scanning the VIN's QR");
        
        console.log("Setting Login Status");

        loginStatus.setLoggedIn();

        console.log("Login Status:"+loginStatus.isLoggedIn());

        //Redirect to main page
        redirectToMainPage();
        
    };

    $scope.submit = function(){

        console.log("Submit Hit!");

        var username = $scope.username;
        var password = $scope.password;

        console.log("Setting Login Status");

        loginStatus.setLoggedIn();
        loginStatus.setUsername (username);

        console.log("Login Status:"+loginStatus.isLoggedIn() + ", Username:" + loginStatus.getUsername() );

        //Redirect to main page
        redirectToMainPage();

    }

    function redirectToMainPage(){
        
        //Redirect to main page
        $window.location = "#";
        
    }

    $scope.returnLoginStatus = function(){

        return loginStatus.isLoggedIn();
    }

    $scope.logout = function(){

        loginStatus.clearLoginStatus();

        $window.reload();

    }

    $scope.disableFormElement = function(elem){

        if (elem == "submitBtn"){
            if ($scope.username == null || $scope.username.length < 1 
                || $scope.password == null || $scope.password.length <1 ){
                return true;
            }
            else{
                return false;
            }
        }
    }

}]);
