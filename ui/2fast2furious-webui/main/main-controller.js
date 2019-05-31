myApp.controller('mainController', ['$scope', '$window', '$timeout', '$http', '$filter', 'loginStatus', 'messagingService',
                 function($scope, $window, $timeout, $http, $filter, loginStatus, messagingService) {
    $scope.pageName = 'Main';
    $scope.userProfiles = [];

    $scope.partInfo = null;
    $scope.currentUserProfile = null;
    //possible values: VIEW, EDIT, SUBMIT
    $scope.mode = "VIEW";
    $scope.connectedToSolace = false;

    console.log("Mode:"+$scope.mode);

    console.log("In Main page!");


    // On login, check the login status

    if (!loginStatus.isLoggedIn()){
        
        console.log("Not Logged in! Redirecting to Login Page..");

        redirectToLoginPage();

    } else{

        /* Initialise the page! */

        console.log("You are logged in, you should be able to see the main screen!");
        console.log("Username:" +loginStatus.getUsername());

        // On page load, show the loading spinner for 3 seconds to simulate that the profile is being retrieved
        $scope.showLoadingProfile = true;
        $scope.displayUserProfile = false;
        $scope.displayUserProfileNotFound = false;

        loadUserProfileDataFromFile();
        loadPartInfoFromFile();

        $timeout(function () {
            $scope.showLoadingProfile = false;

            if( $scope.currentUserProfile == null){
                //show alert
                console.log("Current user profile is null..");
                $scope.displayUserProfile = false;
                $scope.displayUserProfileNotFound = true;
                // alert("Unable to load profile for user: "+ loginStatus.getUsername() +  "...Please try logging in with a valid user" );
            }else{
                $scope.displayUserProfile = true;
            }    
        }, 2000);
        
        var connectCallback = function(status, message) {
            console.log("In connectCallback, Returned with status: "+ status + " and message: "+ message); 

            if (status == true){

                $scope.connectedToSolace = true;

                // lets try subscribing now!

                messagingService.subscribe(subscribeCallback);
                messagingService.onReceive(msgCallback);
            }
        };

        var subscribeCallback = function(status, message) {
            console.log("In subscribeCallback, Returned with status: "+ status + " and message: "+ message); 
        };
        
        var msgCallback = function(message) {
            console.log("In onReceive, Received Message:" + message); 
            
            // lets send a message on c/d

            messagingService.publish("hello", publishCallback);
        };

        var publishCallback = function(status, message) {
            console.log("In publishCallback, Returned with status: "+ status + " and message: "+ message); 
        };

        

    }

    /* Function Definitions */

    function redirectToLoginPage(){
        
        console.log("Redirecting to login page..")

        //Redirect to main page
        $window.location = "#!login";
        
    }

    $scope.returnLoginStatus = function(){

        return loginStatus.isLoggedIn();
    }

    function loadUserProfileDataFromFile(){

        console.log("In loadUserProfileDataFromFile");

        $http.get('canned-data/user-data/userProfiles.json')
       .then(function(res){
          $scope.userProfiles = res.data;
          console.log("Loaded canned user data successfully");
          console.log($scope.userProfiles);

          $scope.currentUserProfile = getCurrentUserProfile(loginStatus.getUsername() );

          console.log("Current User:");
          console.log( $scope.currentUserProfile );

          if ($scope.currentUserProfile != null){

            console.log("Lets try  using Solace shall we..");

            messagingService.connect(connectCallback);
        }
                       
        });

    };

    function loadPartInfoFromFile(){
        console.log("In loadPartInfo");

        $http.get('canned-data/user-data/partInfo.json')
       .then(function(res){
          $scope.partInfo = res.data;
          console.log("Loaded canned part info successfully");
          console.log($scope.partInfo);
                       
        });
    }

    function getCurrentUserProfile(aUsername){

        for (userProfile of $scope.userProfiles){

            if(userProfile.username == aUsername){
                return userProfile;
            }
        }
        return null;
    }

    $scope.showFormElement = function(mode){

        if ($scope.mode == mode){
            return true;
        }else{
            return false;
        }

        // if (element == "configureBtn"){
        //     if ($scope.mode == "VIEW"){
        //         return true;
        //     }
        //     else if ($scope.mode == "EDIT"){
        //         return false;
        //     }
        // }
        // else if (element == "estimateBtn"){
        //     if ($scope.mode == "VIEW"){
        //         return false;
        //     }
        //     else if ($scope.mode == "EDIT"){
        //         return true;
        //     }
        // }
        // else if (element == "cancelBtn"){
        //     if ($scope.mode == "VIEW"){
        //         return false;
        //     }
        //     else if ($scope.mode == "EDIT"){
        //         return true;
        //     }
        // }else{
        //     // default behavior: show element only in EDIT mode
        //     if ($scope.mode == "EDIT"){
        //         return true;
        //     }
        //     else if ($scope.mode == "VIEW"){
        //         return false;
        //     }
        // }   
    }

    $scope.configure = function(){
        $scope.mode = "EDIT";
    };

    $scope.cancel = function(){
        $scope.mode = "VIEW";
    };

    $scope.estimate = function(){
        // Compose details of parts changes and send a message to Solace with the request
       
    };

    $scope.getModelFromVisualPart = function(part){

        if ($scope.currentUserProfile != null){

            var partObj = $filter('filter')($scope.currentUserProfile.car.parts.visual, {'type':part });
            console.log("got partObj:");
            console.log(partObj);
            return partObj[0].model;
        }
        else{
            return null;
        }
    };

    $scope.getValueFromPerformanceAttr = function(attr){

        console.log(attr);

        if ($scope.currentUserProfile != null){

            var partObj = $filter('filter')($scope.currentUserProfile.car.parts.performance, {'type':attr });
            console.log("got partObj:");
            console.log(partObj);
            return partObj[0].value;
        }
        else{
            return null;
        }
    }
        
    







    

}]);

