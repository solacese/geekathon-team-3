////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Solace Corporation Messaging API for JavaScript
// Copyright 2010-2016 Solace Corporation. All rights reserved. //
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to use
// and copy the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// UNLESS STATED ELSEWHERE BETWEEN YOU AND SOLACE CORPORATION, THE SOFTWARE
// IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR
// A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
// IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// http://www.solace.com
//
////////////////////////  User Interface ///////////////////////////////////////////////////////////////////////////////

// The following line is for processing by JSLint.
/*global jQuery:true, $:true, solace:true, window:true */

var scloud_url = "ws://mr-xy4p45t57.messaging.solace.cloud:20099";
var gce_url = "ws://35.187.90.140:80";
var emea1_url = "ws://192.168.32.150:80";
var url;

$(function() {
    // Tabs
    $('#tabs').tabs();
    // Dialog
    $('#dialog').dialog({
        autoOpen: false,
        width: 300,
        buttons: {
            "Ok": function() {
                $(this).dialog("close");
                solace.sample.onLogin();
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });
    // Dialog Link
    $('#dialog_link').click(function() {
        $('#dialog').dialog('open');
        return false;
    });
    //hover states on the static widgets
    $('#dialog_link, ul#icons li').hover(
            function() {
                $(this).addClass('ui-state-hover');
            },
            function() {
                $(this).removeClass('ui-state-hover');
            }
    );
    // Button
    $("#LoginButton").button({
        text: true,
        icons: {
            primary: "ui-icon-check"
        }
    });
    $("#LogoutButton").button({
        text: true,
        icons: {
            primary: "ui-icon-closethick"
        }
    });
    $("#ClearButton").button({
        text: true,
        width: 100,
        icons: {
            primary: "ui-icon-trash"
        }
    });
});

var solace = solace || {};
solace.sample = solace.sample || {};

(function() {
    var ns = this;
    this.utils_appendToConsole = function(message) {
        ns.utils_appendLineToTextArea("output_console", message, true);
    };

    this.utils_checkNickname = function() {
      var name = ns.utils_getNickName();
    }

    this.utils_showConsole = function() {
        var visible = ns.utils_isChecked("input_show_console");
        ns.utils_setVisibility("output_console", visible);
        ns.utils_setVisibility("ClearButton", visible);
    };

    this.utils_clearConsole = function() {
         ns.utils_clearTextArea("output_console");
    };

    this.utils_appendToMessages = function(message) {
        ns.utils_appendLineToTextArea("output_messages", message, true);
    };

    this.utils_getNickName = function() {
        return ns.utils_getField("input_session_nickname");
    };

    this.utils_getUrl = function() {
        return ns.utils_getField("input_session_url");
    };

    this.utils_getUserName = function() {
        return ns.utils_getField("input_session_username");
    };

    this.utils_getVPN = function() {
        return ns.utils_getField("input_session_vpn");
    };

    this.utils_getPassword = function() {
        return ns.utils_getField("input_session_password");
    };

    this.utils_getShowNoLocal = function() {
        return ns.utils_isChecked("input_session_no_loal");
    };

    this.utils_getTextMessage = function() {
        return ns.utils_getField("input_messageText");
    };

    this.utils_Button_Login_setState = function(state) {
        if (state) {
          document.getElementById("Connect").disabled = false;
        } else {
          document.getElementById("Connect").disabled = true;
	}
    };

    this.utils_Button_Logout_setState = function(state) {
        if (state) {
          document.getElementById("Disconnect").disabled = false;
        } else {
          document.getElementById("Disconnect").disabled = true;
	}
    };

    this.utils_updateBuddiesOnline = function(list,currentList) {
        list.sort();
        currentList.sort();
        if (list.length === currentList.length) {
           ns.utils_printList('buddies',list);
        }
        else if (list.length !== currentList.length) {
           ns.utils_printList('buddies',list);
        } else {
            for (var i = 0 ; i < list.length ; i++) {
                if (list[i] !== currentList[i]) {
                    ns.utils_printList('buddies',list);
                    return;
                }
            }
        }

    };

    this.signal_loggedIn = function() {
        ns.utils_Button_Login_setState(false);
        ns.utils_Button_Logout_setState(true);
        ns.utils_element_enable("input_messageText",true);
	for (let element of ["output_messages", "input_messageText", "message_span"]) {
	  document.getElementById(element).style.visibility = "visible";
	}
	document.getElementById("login_message").style.visibility = "hidden";
         $('#nickname').html("Messenger - " + ns.utils_getNickName() + " -");
        $('#input_messageText').focus();
    };

    this.signal_loggedOut = function() {
        ns.utils_setText("input_messageText","");
        ns.utils_Button_Login_setState(true);
        ns.utils_Button_Logout_setState(false);
        ns.utils_element_enable("input_messageText",false);
        $('#nickname').html("Messenger - Signed Out - ");
    };

    this.signal_loggingIn = function() {
        ns.utils_setText("input_messageText","");
        ns.utils_Button_Login_setState(false);
        ns.utils_Button_Logout_setState(false);
        ns.utils_element_enable("input_messageText",true);
    };

}.apply(solace.sample));

/**
 * jquery initialize page function
 */
$(document).ready(function() {
    var path = document.URL;
    var prefix = '';
    var index1 = path.indexOf('//');
    var index2 = -1;
    if (index1 > 0) {
        index2 = path.indexOf('/', index1+2);
        if (index2 > 0) {
            prefix = path.substring(0, index2);
        }
    }

    var DEFAULT_APPLIANCE_URL = prefix + '/solace/smf';
    var DEFAULT_USER_NAME  = 'default';
    var DEFAULT_MSG_VPN    = 'default';
    var DEFAULT_NICKNAME   = "";
    var DEFAULT_NO_LOCAL  = false;

    solace.sample.signal_loggedOut();
    solace.sample.utils_setText('output_messages','');
    solace.sample.utils_setText('output_console','');
    solace.sample.utils_setChecked('input_show_console', false);
    solace.sample.utils_setVisibility('output_console', false);
    solace.sample.utils_setVisibility('ClearButton', false);
    $('body').layout({ applyDefaultStyles: true });
    solace.sample.utils_setText('input_session_url',DEFAULT_APPLIANCE_URL);
    solace.sample.utils_setText('input_session_username',DEFAULT_USER_NAME);
    solace.sample.utils_setText('input_session_vpn',DEFAULT_MSG_VPN);
    solace.sample.utils_setText('input_session_nickname',DEFAULT_NICKNAME);
    solace.sample.utils_setChecked('input_session_no_local', DEFAULT_NO_LOCAL);
});

$(window).unload(function() {
    solace.sample.cleanup();
});


