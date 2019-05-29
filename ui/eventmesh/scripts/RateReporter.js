/**
 * Rate Reporter
 *  A Javascript library to query the message rate between to Solace routers
 *
 */

var RateReporter = function() {
	// To Do: check the MNR or bridge exists?  If not, delete from list.

	// Top level object
	var reporter = {};
	reporter.session = null;
	reporter.connected = false;
	reporter.receivedUnexpected = false;
	reporter.requests = [];
	reporter.cb = null;
	reporter.parser = new DOMParser();
	reporter.solaceLoglevel = solace.LogLevel.WARN;
	reporter.internalSolaceFactory = true;

	reporter.queryTypeEnum = ({"MNR":1, "Bridge":2, "Callback":3, "Client":4});
	if (Object.freeze) { Object.freeze(reporter.queryTypeEnum); }
	reporter.queryType = reporter.queryTypeEnum.MNR;

	// Holds router configuration
	var routerConfig = {};
	routerConfig.url = null;
	routerConfig.vpnName = null;
	routerConfig.password = null;
	routerConfig.userName = null;
	routerConfig.myPhysicalName = "solace";
	routerConfig.otherRouterPhysicalNames = [];
	routerConfig.bridgeNames = [];
  routerConfig.clientNames = [];
	routerConfig.version = "soltr/8_7VMR";

	var reporterError = {};
	reporterError.text = "";
	reporterError.exceptionText = "";

	reporter.setUrl 			= function(url) 		{  routerConfig.url = url; };
	reporter.setVpnName		= function(name) 	{  routerConfig.vpnName = name; };
	reporter.setPassword		= function(pass) 	{  routerConfig.password = pass; };
	reporter.setUserName	 	= function(username)	{  routerConfig.userName = username; };
	reporter.setPhysicalName = function(name)    {  routerConfig.myPhysicalName = name ; };

	reporter.addOtherRouterPhysicalName = function(other) {
		reporter.queryType = reporter.queryTypeEnum.MNR;
		routerConfig.otherRouterPhysicalNames.push(other);
	};

	reporter.addBridgeName = function(bridge) {
		reporter.queryType = reporter.queryTypeEnum.Bridge;
		routerConfig.bridgeNames.push(bridge);
	};

  reporter.addClientName = function(client) {
		reporter.queryType = reporter.queryTypeEnum.Client;
		routerConfig.clientNames.push(client);
	};

	reporter.setQueryType = function(type) {
		if (!reporter.queryTypeEnum.type) {
			reporter.debug("Attempt to set query type to an invalid value (" + type +
					"), leaving it as " + reporter.queryType);
			console.log("Not a valid query type, ignoring: " + type);
			return;
		}
		reporter.queryType = type;
	};

    reporter.setCb 			= function(cb)		{	reporter.cb = cb; }
    reporter.setSolaceLoglevel = function(level) {	reporter.solaceLogLevel = level; }
    reporter.setVersion = function(version) 		{	routerConfig.version = version; }

	reporter.getUrl 			= function() 	{  return routerConfig.url ; };
	reporter.getVpnName		= function() 	{  return routerConfig.vpnName; };
	reporter.getPassword		= function() 	{  return routerConfig.password; };
	reporter.getUserName	 	= function() 	{  return routerConfig.username; };
	reporter.getOtherRouterPhysicalName =
			function() {  return routerConfig.otherRouterPhysicalNames; };

	reporter.createSolaceFactory = function() {
      // Initialize factory with the most recent API defaults
      var factoryProps = new solace.SolclientFactoryProperties();
//       factoryProps.profile = solace.SolclientFactoryProfiles.version10;
      solace.SolclientFactory.init(factoryProps);

      // enable logging to JavaScript console at WARN level
      // NOTICE: works only with "solclientjs-debug.js"
      solace.SolclientFactory.setLogLevel(reporter.solaceLogLevel);
	}

	reporter.debug = function(text) {
		if (reporter.solaceLogLevel == solace.LogLevel.DEBUG) {
			console.log("DEBUG: " + text);
		}
	}

	 // Establishes connection to Solace message router
    reporter.connect = function () {

        if (reporter.session !== null) {
            console.log('Already connected.');
            return;
        }
        // check for valid protocols
        if (routerConfig.url.lastIndexOf('ws://', 0) !== 0 && routerConfig.url.lastIndexOf('wss://', 0) !== 0 &&
        		routerConfig.url.lastIndexOf('http://', 0) !== 0 && routerConfig.url.lastIndexOf('https://', 0) !== 0) {
            console.log('Invalid protocol - please use one of ws://, wss://, http://, https://');
            return;
        }

        if (!routerConfig.userName) {
        	    reporterError.text = "No username specified.  Call RateReporter.setUserName(...)";
            reporterError.exceptionText = "";
            console.log('Cannot connect: please specify username.');
        }
        if (!routerConfig.password) {
    	        reporterError.text = "No password specified.  Call RateReporter.Password(...).  If your VPN doesn't have a password configured, use nonsense.";
            reporterError.exceptionText = "";
    	        console.log('Cannot connect: please specify password.');

        }
        if (!routerConfig.vpnName) {
          	reporterError.text = "No VPN specified.  Call RateReporter.setVpnName(...)";
          	reporterError.exceptionText = "";
            console.log('Cannot connect: please specify vpn.');
            return;
        }
        // Create request messages
        reporter.createRequests();

        console.log('Connecting to Solace message router using url: ' + routerConfig.url);
        console.log('Client username: ' + routerConfig.userName);
        console.log('Solace message router VPN name: ' + routerConfig.vpnName);
        // create session
        try {
            reporter.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      routerConfig.url,
                vpnName:  routerConfig.vpnName,
                userName: routerConfig.userName,
                password: routerConfig.password,
            });
        } catch (error) {
        	    reporterError.text = "Failed to create session.  This is unusual - are you out of memory?";
        	    reporterError.exceptionText = error.toString();
            console.log("Session create faileed, exception: " + error.toString());
        }
        // define session event listeners
        reporter.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
        	    reporter.connected = true;
            console.log('=== Successfully connected and ready to start the message consumer. ===');
            // Start the rate requester
            setInterval(function() {
          	    reporter.request();
          	  }, 1000);
        })

        reporter.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
        	    reporter.connected = false;
        	    reporterError.text = "Failed to connect session.  Check your address, username, password, VPN etc.";
        	    reporterError.exceptionText = sessionEvent.infoStr;
            console.log('Connection failed to the message router: ' + sessionEvent.infoStr +
                ' - check correct parameter values and connectivity!');
        });

        reporter.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            console.log('Disconnected.');
            reporter.connected = false;
            if (reporter.session !== null) {
                reporter.session.dispose();
                reporter.session = null;
            }
        });

        reporter.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
            console.log('Cannot subscribe to topic - I wasn\'t expecting to subscribe to anything?: ' + sessionEvent.correlationKey);
        });
        reporter.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
        });

        // define message event listener
        reporter.session.on(solace.SessionEventCode.MESSAGE, function (message) {
        	  if (!reporter.receivedUnexpected) {
            console.log("Received messages, and I wasn't expecting to.  Have I subscribed to something?");
            reporter.receivedUnexpected = true;
        	  }
        });

        try {
            reporter.session.connect();
        } catch (error) {
        	    reporterError.text = "Tried to connect the session but got an exception.";
        	    reporterError.exceptionText = error.toString();
            console.log(error.toString());
        }
    };

    reporter.disconnect = function () {

        if (reporter.session == null) {
            console.log('Already disconnected.');
            return;
        }
        // create session
        try {
            reporter.session.disconnect();
        } catch (error) {
        	    reporterError.text = "Failed to disconnect session.  This is unusual...";
        	    reporterError.exceptionText = error.toString();
            console.log("Session disconnect faileed, exception: " + error.toString());
        }
    }

    reporter.createRequests = function() {
    	  if (reporter.queryType == reporter.queryTypeEnum.MNR) {
    	    routerConfig.otherRouterPhysicalNames.forEach(function(router) {
    	      reporter.debug("SEMP query for router: " + router);
    		  var msg = solace.SolclientFactory.createMessage();
    		  msg.setDestination(solace.SolclientFactory.createTopic('#SEMP/' + routerConfig.myPhysicalName + '/SHOW'));
    	      msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
    	      var msgText = "<rpc semp-version='" + routerConfig.version +
    	        "'> <show> <cspf> <neighbor> <physical-router-name>" +
    	        router + "</physical-router-name> <stats></stats> </neighbor> </cspf> </show> </rpc>";
    	      reporter.debug(msgText);
    	      msg.setBinaryAttachment(msgText);
    	      reporter.requests.push({"router" : router, "message" : msg});
    	    }) ;
    	  }
    	  if (reporter.queryType == reporter.queryTypeEnum.Bridge) {
      	  routerConfig.bridgeNames.forEach(function(bridge) {
      	      reporter.debug("SEMP query for bridge: " + bridge);
      		  var msg = solace.SolclientFactory.createMessage();
      		  msg.setDestination(solace.SolclientFactory.createTopic('#SEMP/' + routerConfig.myPhysicalName + '/SHOW'));
      	      msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
      	      var msgText = "<rpc semp-version='" + routerConfig.version +
      	        "'> <show> <bridge> <bridge-name-pattern>" + bridge + "</bridge-name-pattern>"+
      	        "<vpn-name-pattern>" + routerConfig.vpnName + "</vpn-name-pattern><stats/></bridge></show> </rpc>";
      	      reporter.debug(msgText);
      	      msg.setBinaryAttachment(msgText);
      	      reporter.requests.push({"bridge" : bridge, "message" : msg});
      	    }) ;
    	  }
        if (reporter.queryType == reporter.queryTypeEnum.Client) {
      	  routerConfig.clientNames.forEach(function(client) {
      	      reporter.debug("SEMP query for client: " + client);
      		    var msg = solace.SolclientFactory.createMessage();
      		    msg.setDestination(solace.SolclientFactory.createTopic('#SEMP/' + routerConfig.myPhysicalName + '/SHOW'));
      	      msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
      	      var msgText = "<rpc semp-version='" + routerConfig.version +
      	        "'> <show> <client> <name>" + client + "</name>"+
      	        "<vpn-name>" + routerConfig.vpnName + "</vpn-name><stats/></client></show> </rpc>";
      	      reporter.debug(msgText);
      	      msg.setBinaryAttachment(msgText);
      	      reporter.requests.push({"client" : client, "message" : msg});
      	    }) ;
    	  }
    	  if (reporter.queryType == reporter.queryTypeEnum.Callback) {
    		  // Call user code to create query
    		  console.log("User query NYI");
    	  }
    }

    reporter.request = function() {
    	 if (!reporter.connected) {
    		 reporter.debug("Session disconnected, not sending SEMP requests");
    		 return;
    	 }
    	 reporter.debug("Process " + reporter.requests.length + " requests");
    	 var reportedOn = null;
    	 reporter.requests.forEach(function(request) {
   		  try {
   			  reporter.session.sendRequest(request.message, 500, function(session, message) {
   	    	        reporter.debug("SEMP Response: " + message.getBinaryAttachment());
   	    	        switch (reporter.queryType) {
   	    	        case reporter.queryTypeEnum.MNR:
   	    	        	  rate = reporter.parseResponseMnr(message.getBinaryAttachment());
   	    	        	  reportedOn = request.router;
   	    	        	  break;
   	    	        case reporter.queryTypeEnum.Bridge:
   	    	        	  rate = reporter.parseResponseBridge(message.getBinaryAttachment());
   	    	        	  reportedOn = request.bridge;
   	    	        	  break;
                  case reporter.queryTypeEnum.Client:
   	    	        	  rate = reporter.parseResponseClient(message.getBinaryAttachment());
   	    	        	  reportedOn = request.client;
   	    	        	  break;
   	    	        case reporter.queryTypeEnum.Callback:
   	    	        	  // NYI
   	    	        	  break;
   	    	        }

   				reporter.debug("Extracted rate: " + rate);
   				reporter.cb(reportedOn, rate);
   			  });
   		  } catch (error) {
   			  reporterError.text = "Failed to send SEMP request";
   			  reporterError.exceptionText = error.toString();
   			  console.log("Failed to send SEMP request: " + error.toString());
   		  }
   	   });
    }

	 reporter.parseResponseMnr = function(xml) {
		  var xmlDoc = reporter.parser.parseFromString(xml, "text/xml");
		  if (xmlDoc == null) {
   			 reporterError.text = "Failed to parse SEMP xml response";
   			 reporterError.exceptionText = xml;
			 console.log ("Can't parse reply: " + xml);
		     return 0;
	      }
		  var rateTag = xmlDoc.getElementsByTagName("current-message-rate-messages-per-second")[0];
		  if (rateTag == null) {
	   		  reporterError.text = "Failed to parse SEMP xml Rate Tag";
	   		  reporterError.exceptionText = xml;
			  console.log ("Can't parse Rate Tag.  Do you have any objects (e.g. CSPF neighbours/bridges?" + xml);
			  return 0;
	      }
		  var ingressRate = rateTag.childNodes[1].childNodes[0].nodeValue;
		  if (ingressRate == null) {
	   	    reporterError.text = "Failed to parse SEMP xml ingressRate";
	   		reporterError.exceptionText = xml;
			console.log ("Can't parse ingressRate");
			return 0;
		  }
		  var egressRate = rateTag.childNodes[3].childNodes[0].nodeValue;
		  if (egressRate == null) {
	   		reporterError.text = "Failed to parse SEMP xml response";
	   		reporterError.exceptionText = xml;
	   		console.log ("Can't parse egressRate");
	   		return 0;
	   	  }
		  var rate = parseInt(ingressRate) + parseInt(egressRate);
		  return rate;
	 }

	 reporter.parseResponseBridge = function(xml) {
		 //console.log("XML" + xml);
		  var xmlDoc = reporter.parser.parseFromString(xml, "text/xml");
		  if (xmlDoc == null) {
   			 reporterError.text = "Failed to parse SEMP xml response";
   			 reporterError.exceptionText = xml;
			 console.log ("Can't parse reply: " + xml);
		     return 0;
	      }
		  var ingressRateTag = xmlDoc.getElementsByTagName("current-ingress-rate-per-second")[0];
		  if (ingressRateTag == null) {
	   		  reporterError.text = "Failed to parse SEMP xml Ingress Rate Tag";
	   		  reporterError.exceptionText = xml;
			  console.log ("Can't parse Ingress Rate Tag.  Do you have any objects (e.g. CSPF neighbours/bridges?" + xml);
			  return 0;
	      }
		  var ingressRate = ingressRateTag.childNodes[0].nodeValue;

		  var egressRateTag = xmlDoc.getElementsByTagName("current-egress-rate-per-second")[0];
		  if (egressRateTag == null) {
	   		  reporterError.text = "Failed to parse SEMP xml Egress Rate Tag";
	   		  reporterError.exceptionText = xml;
			  console.log ("Can't parse Egress Rate Tag.  Do you have any objects (e.g. CSPF neighbours/bridges?" + xml);
			  return 0;
	      }
		  var egressRate = egressRateTag.childNodes[0].nodeValue;
		  console.debug("Ingress rate: " + ingressRate + " egress rate: " + egressRate);
		  return parseInt(ingressRate) + parseInt(egressRate);
	 }

   reporter.parseResponseClient = function(xml) {
		 //console.log("XML" + xml);
		  var xmlDoc = reporter.parser.parseFromString(xml, "text/xml");
		  if (xmlDoc == null) {
   			 reporterError.text = "Failed to parse SEMP xml response";
   			 reporterError.exceptionText = xml;
			 console.log ("Can't parse reply: " + xml);
		     return 0;
	      }
		  var ingressRateTag = xmlDoc.getElementsByTagName("current-ingress-rate-per-second")[0];
		  if (ingressRateTag == null) {
	   		  reporterError.text = "Failed to parse SEMP xml Ingress Rate Tag";
	   		  reporterError.exceptionText = xml;
			  console.log ("Can't parse Ingress Rate Tag.  Do you have any objects (e.g. clients?" + xml);
			  return 0;
	      }
		  var ingressRate = ingressRateTag.childNodes[0].nodeValue;

		  var egressRateTag = xmlDoc.getElementsByTagName("current-egress-rate-per-second")[0];
		  if (egressRateTag == null) {
	   		  reporterError.text = "Failed to parse SEMP xml Egress Rate Tag";
	   		  reporterError.exceptionText = xml;
			  console.log ("Can't parse Egress Rate Tag.  Do you have any objects (e.g. clients?" + xml);
			  return 0;
	      }
		  var egressRate = egressRateTag.childNodes[0].nodeValue;
		  console.debug("Ingress rate: " + ingressRate + " egress rate: " + egressRate);
		  return parseInt(ingressRate) + parseInt(egressRate);
	 }


	return reporter;
}
