// Define the PubSub Service

myApp.factory("messagingService", function(){

    var mySolace = new PubSubPlusBroker();

    // change to use user-provided callback
    function connect(connectCallback){
        console.log("+++ in connect..");

        mySolace.connect(connectCallback);

    }

    // change to use user-provided callback
    function subscribe(subEventCallback){

        mySolace.subscribe(subEventCallback);
        
    }

    function onReceive(msgCallback){

        console.log("++++ in onReceive..");

        mySolace.onTopicMessage(msgCallback);

    }

    // change to use user-provided callback
    function publish(msgBody, publishCallback){

        console.log("++++ in publish..");

        mySolace.publish(msgBody, publishCallback);
    }

    return {
        connect             : connect,
        subscribe           : subscribe,
        onReceive           : onReceive,
        publish             : publish
    }

});