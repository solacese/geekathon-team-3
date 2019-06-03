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
    $scope.stubOutSolace = false;
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
        if ($scope.stubOutSolace){
            loadCannedOMSResponseFromFile();
        }

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
                //messagingService.onReceive(msgCallback);
                messagingService.onReceive(estimateCallback);
            }
        };

        var subscribeCallback = function(status, message) {
            console.log("In subscribeCallback, Returned with status: "+ status + " and message: "+ message); 
        };
        
        var msgCallback = function(message) {
            console.log("In onReceive, Received Message:" + message); 
            
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

        console.log("Curernt profile");
        console.log($scope.currentUserProfile);

        var newOrderPayload = {};
        newOrderPayload.vin = $scope.currentUserProfile.car.about.vin;
        newOrderPayload.parts = [];

        if ($scope.newOrder.selectedAcceleration != getValueFromPerformanceAttrCurrProfile('acceleration') ){
            var part = {};
            part.category = 'performance';
            part.type     = 'acceleration';
            part.value    = $scope.newOrder.selectedAcceleration;
            newOrderPayload.parts.push(part);

        }

        if ($scope.newOrder.selectedDrivetrain != getValueFromPerformanceAttrCurrProfile('drivetrain') ){
            var part = {};
            part.category = 'performance';
            part.type     = 'drivetrain';
            part.value    = $scope.newOrder.selectedDrivetrain;
            newOrderPayload.parts.push(part);
            
        }

        if ($scope.newOrder.selectedTopspeed != getValueFromPerformanceAttrCurrProfile('topspeed') ){
            var part = {};
            part.category = 'performance';
            part.type     = 'topspeed';
            part.value    = $scope.newOrder.selectedTopspeed;
            newOrderPayload.parts.push(part);
        }

        if($scope.newOrder.selectedHandling != getValueFromPerformanceAttrCurrProfile('handling') ){
            var part = {};
            part.category = 'performance';
            part.type     = 'handling';
            part.value    = $scope.newOrder.selectedHandling;
            newOrderPayload.parts.push(part);
        }

        if ($scope.newOrder.selectedNitrous != getValueFromPerformanceAttrCurrProfile('nitrous' )) {
            var part = {};
            part.category = 'performance';
            part.type     = 'nitrous';
            part.value    = $scope.newOrder.selectedNitrous;
            newOrderPayload.parts.push(part);
        }

        //visual

        if ($scope.newOrder.selectedPaint != getModelFromVisualPartCurrProfile('paint') ){
            var part = {};
            part.category = 'visual';
            part.type     = 'acceleration';
            part.value    = $scope.newOrder.selectedPaint;
            newOrderPayload.parts.push(part);

        }

        if ($scope.newOrder.selectedDecals != getModelFromVisualPartCurrProfile('decals') ){
            var part = {};
            part.category = 'visual';
            part.type     = 'drivetrain';
            part.value    = $scope.newOrder.selectedDecals;
            newOrderPayload.parts.push(part);
            
        }

        if ($scope.newOrder.selectedWheels != getModelFromVisualPartCurrProfile('wheels')  ){
            var part = {};
            part.category = 'visual';
            part.type     = 'topspeed';
            part.value    = $scope.newOrder.selectedWheels;
            newOrderPayload.parts.push(part);
        }

        if($scope.newOrder.selectedHeadlights != getModelFromVisualPartCurrProfile('headlights') ){
            var part = {};
            part.category = 'visual';
            part.type     = 'handling';
            part.value    = $scope.newOrder.selectedHeadlights;
            newOrderPayload.parts.push(part);
        }

        if ($scope.newOrder.selectedWindowtint != getModelFromVisualPartCurrProfile('windowtint') ){
            var part = {};
            part.category = 'visual';
            part.type     = 'nitrous';
            part.value    = $scope.newOrder.selectedWindowtint;
            newOrderPayload.parts.push(part);
        }

        console.log("about to publish payload");

        console.log(newOrderPayload);

        var publishPayload = angular.toJson(newOrderPayload);

        if ($scope.stubOutSolace){
            estimateCallback();
        }else{
            //publish the order
            messagingService.publish( publishPayload, publishCallback);
        }
          
    };

    

    function estimateCallback(messagePayload){

        // this is the callback function which will be triggered when the estimate from Solace is received
        
        if (messagePayload != null){
            console.log("in estimateCallback, cost estimate message received..");
            
            // messagePayload = messagePayload.substring(messagePayload.indexOf("{"));

            // var p=messagePayload.lastIndexOf("}");
            // console.log(p);

            // //messagePayload = messagePayload.substring(p + 1);

            // console.log(messagePayload);
            // console.log(typeof(messagePayload));
            
            // //$scope.omsResponse = messagePayload.substring(3);

            // //$scope.omsResponse = messagePayload;

            // $scope.omsResponse = angular.toJson(messagePayload);

            
            if (messagePayload.getType() == solace.MessageType.TEXT)
            {
                var txtStr = messagePayload.getSdtContainer().getValue();
                $scope.omsResponse = angular.fromJson(txtStr);
                console.log(typeof ($scope.omsResponse) );
                console.log($scope.omsResponse);
            }


            //console.log("oms response:");
            //console.log($scope.omsResponse);

        }

        //parse message and set params
        getPartsEstimateByCategoryOmsResponse('visual');
        getPartsEstimateByCategoryOmsResponse('performance');
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

        console.log("omsResponse:");
        console.log($scope.omsResponse);

        if ($scope.omsResponse != null){

            var partsArr = $filter('filter')($scope.omsResponse.parts, {'category':category });
            
            if (category == 'visual'){

                $scope.partsEstimate.visual = partsArr;
            }
            else if(category == 'performance'){

                $scope.partsEstimate.performance = partsArr;

            }
    
            console.log("parts estimate:"+ $scope.partsEstimate);
            
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

