////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Corporation Messaging API for JavaScript
// Copyright 2010-2016 Solace Corporation. All rights reserved. //
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to use and
// copy the Software, and to permit persons to whom the Software is furnished to
// do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE CORPORATION, THE SOFTWARE IS
// PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// http://www.solace.com
//
//                              * Messenger *
//
// This sample demonstrates a very simple server-less chat/messenger client that demonstrates the following:
//  - Subscribing to a topic for direct messages
//  - Publishing direct messages to a topic
//  - Receiving messages with callbacks
//  - Using SDT (Structured Data Types)
//  - No local delivery (when this option is selected during login, the chat client won't receive
//    his own messages and won't see himself as online buddies)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var solace = solace || {};
solace.sample = solace.sample || {};

(function() {
    var OPERATION_TIMEOUT = 30000;
    var ns = this;
    /**
     * Data members in the global scope
     */
    var mySessionProperties = null;
    var mySession = null;
    var myNickName = null;
    var rendezVousTopic = 'global/messenger';
    var statusInterval = null;
    var onlineInterval = null;
    var myBuddiesOnline = [];
    var currentList = [];

    var sessionEventCb; // forward declaration
    var messageEventCb; // forward declaration

    /**
     * Creates a Map message to let the other clients know that a new user has logged in or to send a msg other clients
     * in the same conversation
     * @param nickName
     * @param text
     */
    function createMsg(nickName, text) {
        var msg = solace.SolclientFactory.createMessage();
        // Set the topic to rendezVousTopic
        msg.setDestination(solace.SolclientFactory.createTopic(rendezVousTopic));
        // Set delivery mode
        msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
        // Create an SDT Map
        var sdtMap = new solace.SDTMapContainer();
        // nickName
        sdtMap.addField("clientName", solace.SDTField.create(solace.SDTFieldType.STRING, nickName));
        // message text
        if (text !== undefined) {
            sdtMap.addField("messageText", solace.SDTField.create(solace.SDTFieldType.STRING, text));
        }
        // Put it in the message
        msg.setSdtContainer(solace.SDTField.create(solace.SDTFieldType.MAP, sdtMap));
        return msg;
    }

    /**
     * Initializes the 'I am logged in' stimulus
     */
    function initStatusIntervals() {
        // Used to fire own status messages
        if (statusInterval === null) {
            statusInterval = setInterval(function() {
                var msg = createMsg(myNickName);
                try {
                    mySession.send(msg);
                } catch (error) {
                    // failed to send, therefore stop publishing and log the error thrown
                    ns.utils_appendToConsole("Failed to send KA '" + msg.toString());
                    ns.utils_appendToConsole(error.toString() + error.Message);
                }
            }, 500);
        }
        // Used to update the status of other clients
        if (onlineInterval === null) {
            onlineInterval = setInterval(function() {
                var list = [];
                for (var key in myBuddiesOnline) {
                    if (myBuddiesOnline.hasOwnProperty(key)) {
                        list.push(key);
                    }
                }
                myBuddiesOnline = [];
                ns.utils_updateBuddiesOnline(list,currentList);
                currentList = list;
            }, 20 * 500);
        }
    }

    /**
     * Stops the 'I am logged in' stimulus intervals
     */
    function stopStatusIntervals() {
       if (statusInterval !== null) {
            clearInterval(statusInterval);
            statusInterval = null;
        }
       if (onlineInterval !== null) {
            clearInterval(onlineInterval);
            onlineInterval = null;
        }
       var m_empty = [];
       ns.utils_updateBuddiesOnline(m_empty,currentList);
       currentList = [];
    }

    /**
     * Invoked when the Ok button is clicked on the login dialog. This method will trigger the creation and connect()
     * operation on the session. When successfully connected, handle_sessionConnected() is invoked
     */
    this.onLogin = function() {
        // Check we've selected a cloud provider
        switch (cloud_provider = document.cloud_provider_form.cloud.value) {
          case "scloud":
            url = scloud_url;
            vpn = "msgvpn-xy4p7nrvh";
            break;
          case "gce":
            url = gce_url;
            vpn = "unifiedVapor";
            break;
          case "emea1":
            url = emea1_url;
            vpn = "unifiedVapor";
            break;
          default:
            alert("You must pick a cloud provider to connect to!");
            return;
        }
        // Check nick name
        if (ns.utils_getNickName().length == 0) {
          alert("Please pick a nick name. Keep it clean, people!");
          return;
        }
        // Disable the login, logout buttons
        ns.signal_loggingIn();
        // log to console
        var msg = "Creating Session: [ url='" + ns.utils_getUrl() + "', " +
                "user='" + ns.utils_getUserName() + ", vpn='" + ns.utils_getVPN() + "']";
        ns.utils_appendToConsole(msg);
        // create the session
        try {
            // Create Session
            mySessionProperties = new solace.SessionProperties();
            mySessionProperties.connectTimeoutInMsecs = OPERATION_TIMEOUT;
            mySessionProperties.readTimeoutInMsecs = OPERATION_TIMEOUT;
            mySessionProperties.keepAliveIntervalsLimit = 10;
            mySessionProperties.userName = "unifiedVapor"
            mySessionProperties.vpnName = vpn;
            mySessionProperties.password = "unifiedVapor]]";
            mySessionProperties.url = url;
            myNickName = mySessionProperties.clientName = ns.utils_getNickName();
            
            mySession = solace.SolclientFactory.createSession(mySessionProperties,
                    new solace.MessageRxCBInfo(function(session, message) {
                        messageEventCb(session, message);
                    }, this),
                    new solace.SessionEventCBInfo(function(session, event) {
                        sessionEventCb(session, event);
                    }, this));
            ns.utils_appendToConsole("Session was successfully created.");
            // Connect it
            mySession.connect();
        } catch (error) {
            ns.utils_appendToConsole("Could not login");
            ns.utils_appendToConsole(error.toString());
            if (mySession !== null) {
                mySession.dispose();
                mySession = null;
            }
            ns.signal_loggedOut();
        }
    };

    /**
     * Invoked when the user logs out
     */
    this.onLogout = function() {
        document.getElementById("login_message").style.visibility = "visible";
        for (let element of ["output_messages", "input_messageText", "message_span"]) {
          document.getElementById(element).style.visibility = "hidden";
        }
        stopStatusIntervals();
        ns.cleanup();
        ns.signal_loggedOut();
    };

    /**
     * Invoked when "Show Console" checkbox is clicked
     */
    this.onShowConsole = function() {
        ns.utils_showConsole();
    };

    /**
     * Invoked when Clear button is clicked
     */
    this.onClearConsole = function() {
        ns.utils_clearConsole();
    };

    /**
     * The session was successfully connected, the next step is to add the 'rendez-vous' topic subscription
     */
    this.handle_sessionConnected = function() {
        try {
            mySession.subscribe(solace.SolclientFactory.createTopic(rendezVousTopic), true, this, OPERATION_TIMEOUT);
        } catch (error) {
            ns.utils_appendToConsole("Failed to add topic subscription");
            ns.utils_appendToConsole(error.toString());
            if (mySession !== null) {
                mySession.dispose();
                mySession = null;
            }
            ns.signal_loggedOut();
        }
    };

    /**
     * The subscription was successfully added, the next step is to send a 'I am logged in' message
     */
    this.handle_subscriptionOperationSucceeded = function() {
        // Send a 'I am logged in' message to your buddies
        try {
            var msg = createMsg(mySessionProperties.clientName, "logged in");
            mySession.send(msg);
            ns.signal_loggedIn();
            initStatusIntervals();
        } catch (error) {
            ns.utils_appendToConsole("Failed to create and send a 'I am logged in' message ");
            ns.utils_appendToConsole(error.toString());
            if (mySession !== null) {
                mySession.dispose();
                mySession = null;
            }
            ns.signal_loggedOut();
        }
    };

    /**
     *  Invoked when the user types a text message and hits 'Enter'
     */
    this.onSendMessage = function() {
        try {
            var msg = createMsg(myNickName, ns.utils_getTextMessage());
            mySession.send(msg);
        } catch (error) {
            ns.utils_appendToConsole("Failed to send a message ");
            ns.utils_appendToConsole(error.toString());
        } finally {
            ns.utils_setText("input_messageText", "");
        }
    };


    /**
     * General failure
     * @param text
     * @param forcelog
     */
    this.handle_failure = function(text, forcelog) {
        if (forcelog) {
            ns.utils_appendToMessages(text);
        }
        ns.utils_appendToConsole(text);
        ns.cleanup();
        ns.signal_loggedOut();
    };

    /**
     * General cleanup
     */
    this.cleanup = function() {
        if (mySession !== null) {
            mySession.dispose();
            mySession = null;
        }
    };

////////////////////// Callback functions //////////////////////////////////////////////////////////////////////////////

    /**
     * Session event callback
     * @param session
     * @param event
     */
    sessionEventCb = function (session, event) {
        if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
            ns.handle_sessionConnected();
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_OK) {
            ns.handle_subscriptionOperationSucceeded();
        } else if (event.sessionEventCode === solace.SessionEventCode.SUBSCRIPTION_ERROR) {
            ns.handle_failure("Failed to add subscription", true);
            ns.utils_appendToConsole("Failed to add subscription:  '" + event.correlationKey + "'");
        } else if (event.sessionEventCode === solace.SessionEventCode.LOGIN_FAILURE) {
            ns.handle_failure("Failed to login to appliance:" + event.infoStr, true);
            ns.utils_appendToConsole("Login Failure!");
        } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
            ns.utils_appendToConsole("Connecting...");
        } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
            ns.handle_failure("Session is disconnected", false);
        } else {
            ns.handle_failure("Session failure!", false);
        }
        ns.utils_appendToConsole(event.toString());
    };

    /**
     * Direct message receive callback
     * @param session
     * @param message
     */
    messageEventCb = function (session, message) {
        var sdtContainer = message.getSdtContainer();
        var m_msgText = "";
        var m_nickName = null;
        var m_text = null;
        if (sdtContainer) {
            if (sdtContainer.getType() === solace.SDTFieldType.MAP) {
                if (sdtContainer.getValue().getField("clientName")) {
                    m_nickName = sdtContainer.getValue().getField("clientName").getValue();
                }
                if (sdtContainer.getValue().getField("messageText")) {
                    m_text = sdtContainer.getValue().getField("messageText").getValue();
                }
            }
        }
        if (m_nickName !== null ) {
            // that's a KA message
            myBuddiesOnline[m_nickName] = '';
            var list = [];
            for (var key in myBuddiesOnline) {
                if (myBuddiesOnline.hasOwnProperty(key)) {
                    list.push(key);
                }
            }
            ns.utils_updateBuddiesOnline(list,[]);
            if (m_text !== null) {
                ns.utils_appendToMessages(' ' + m_nickName + '   ' + m_text);
            }
        }
    };

}.apply(solace.sample));








