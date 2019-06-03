myApp.controller('mainController', ['$scope', '$window', '$timeout', '$http', '$filter', 'loginStatus', 'messagingService',
                 function($scope, $window, $timeout, $http, $filter, loginStatus, messagingService) {
    
    $scope.pageName = 'Main';
    $scope.userProfiles = [];

    $scope.partInfo = null;
    $scope.omsResponse = null;
    $scope.currentUserProfile = null;

    $scope.partsEstimate = {};

    $scope.partsEstimate.visual = [];
    $scope.partsEstimate.performance = [];
    
    $scope.mode = "VIEW";               //possible values: VIEW, CONFIGURE, ORDER_ESTIMATE, ORDER_STATUS
    $scope.stubOutSolace = true;
    $scope.connectedToSolace = false;

    console.log("Mode:"+$scope.mode);

    console.log("In Main page!");
    

    $scope.rules = [
        { rulename: "Must be 5 characters" },
        { rulename: "Must not be used elsewhere" },
        { rulename: "Must be cool" }
    ];
    
    console.log($scope.rules);

    $scope.newOrder = {};

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
        loadCannedOMSResponseFromFile();

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

          if ($scope.currentUserProfile != null && !$scope.stubOutSolace ){

            console.log("Lets try  using Solace shall we..");

            messagingService.connect(connectCallback);
        }
                       
        });

    };

    function initialiseNewOrderFromCurrentProfile(){

        $scope.newOrder.selectedPaint  = getModelFromVisualPartCurrProfile('paint');
        $scope.newOrder.selectedWheels = getModelFromVisualPartCurrProfile('wheels');
        $scope.newOrder.selectedHeadlights = getModelFromVisualPartCurrProfile('headlights');
        $scope.newOrder.selectedDecals = getModelFromVisualPartCurrProfile('decals');
        $scope.newOrder.selectedWindowtint = getModelFromVisualPartCurrProfile('windowtint');

        $scope.newOrder.selectedAcceleration  = getValueFromPerformanceAttrCurrProfile('acceleration');
        $scope.newOrder.selectedHandling  = getValueFromPerformanceAttrCurrProfile('handling');
        $scope.newOrder.selectedDrivetrain  = getValueFromPerformanceAttrCurrProfile('drivetrain');
        $scope.newOrder.selectedTopspeed  = getValueFromPerformanceAttrCurrProfile('topspeed');
        $scope.newOrder.selectedNitrous  = getValueFromPerformanceAttrCurrProfile('nitrous');

        console.log("Initialised new order:");
        console.log($scope.newOrder);
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

    function loadCannedOMSResponseFromFile(){
        console.log("In loadCannedOMSResponseFromFile");

        $http.get('canned-data/user-data/omsResponse.json')
       .then(function(res){
          $scope.omsResponse = res.data;
          console.log("Loaded canned OMS response successfully");
          console.log($scope.omsResponse);
                       
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
    }

    $scope.configure = function(){
        $scope.mode = "CONFIGURE";
        initialiseNewOrderFromCurrentProfile();

    };

    $scope.cancel = function(){
        $scope.mode = "VIEW";
    };

    $scope.estimate = function(){

        console.log($scope.newOrder);
        $scope.mode=('ORDER_ESTIMATE');
        

        // Compose details of parts changes and send a message to Solace with the request

        // We simulate it by showing a canned response
        getPartsEstimateByCategoryOmsResponse('visual');
        getPartsEstimateByCategoryOmsResponse('performance');
       
    };

    

    function estimateCallback(){

        // this is the callback function which will be triggered when the estimate from Solace is received
    }

    $scope.getModelFromVisualPartCurrProfile = function(part){

        return getModelFromVisualPartCurrProfile(part);

    }
    
    function getModelFromVisualPartCurrProfile(part){

        if ($scope.currentUserProfile != null){

            var partObj = $filter('filter')($scope.currentUserProfile.car.parts.visual, {'type':part });
            
            return partObj[0].model;
        }
        else{
            return null;
        }
    };

    $scope.getValueFromPerformanceAttrCurrProfile = function(attr){

        return getValueFromPerformanceAttrCurrProfile(attr);

    }

    function getValueFromPerformanceAttrCurrProfile(attr){

        if ($scope.currentUserProfile != null){

            var partObj = $filter('filter')($scope.currentUserProfile.car.parts.performance, {'type':attr });
            
            return partObj[0].value;
        }
        else{
            return null;
        }
    }

    function getPartsEstimateByCategoryOmsResponse(category){

        console.log("in getPartsEstimateByCategory() ");

        if ($scope.omsResponse != null){

            var partsArr = $filter('filter')($scope.omsResponse.parts, {'category':category });
            
            if (category == 'visual'){

                $scope.partsEstimate.visual = partsArr;
            }
            else if(category == 'performance'){

                $scope.partsEstimate.performance = partsArr;

            }
    
            console.log($scope.partsEstimate);
            
        }
    
    }

    $scope.getPartsEstimateByCategoryOmsResponse = function(){
        getPartsEstimateByCategoryOmsResponse();
    }


    $scope.upgradePerformancePart = function(part){

        if (part == 'acceleration'){
            $scope.newOrder.selectedAcceleration +=10;
        }else if (part == 'handling'){
            $scope.newOrder.selectedHandling +=10;
        }else if (part == 'drivetrain'){
            $scope.newOrder.selectedDrivetrain +=10;
        }else if (part == 'topspeed'){
            $scope.newOrder.selectedTopspeed +=10;
        }else if (part == 'nitrous'){
            $scope.newOrder.selectedNitrous +=10;
        }
    }

    $scope.placeOrder = function(){

        console.log("In function placeOrder!!!!!");
        $scope.mode = "ORDER_STATUS";
    }

    function capitalize(string) 
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
        
}]);

