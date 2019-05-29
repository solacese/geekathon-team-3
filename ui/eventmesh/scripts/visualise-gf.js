//Configure position and colour of arrow connectors
var leftCloudX = 350;
var leftCloudY = 265;
var rightCloudX = 1680;
var rightCloudY = 260;
var topCloudLeftX = 1080;
var topCloudLeftY = 135;
var topCloudRightX = topCloudLeftX + 30;
var topCloudRightY = topCloudLeftY;
var topCloudMiddleX = topCloudLeftX + 10;
var topCloudMiddleY = topCloudLeftY + 20;
var bottomDCLeftX = 960;
var bottomDCLeftY = 200;
var bottomDCRightX = bottomDCLeftX + 30;
var bottomDCRightY = bottomDCLeftY;
var bottomDCMiddleX = bottomDCLeftX + 15;
var bottomDCMiddleY = bottomDCLeftY - 5;


//var arrowColour = "#009193"; //teal
//var arrowColour = "#f37021"; //orange
//var arrowColour = "#474747"; //brown
//var arrowColour = "#ffffff"; //white
//var arrowColour = "#00ad93"; //dark green
var arrowColour = "#00c895"; //frog green
var arrowColourBold = "#00c895";
var initThickness = 1;



function canvas_arrow(context, fromx, fromy, tox, toy, thickness){
    context.strokeStyle=arrowColour;
    if (thickness == 0) {
      thickness = 1;
      context.setLineDash([5, 15]);
    } else {
      context.setLineDash([]);
      if (thickness > 10) {
        thickness = 10;
        context.strokeStyle=arrowColourBold;
      }
    }
    var headlen = 10 + (thickness * 2);   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    var halfThick = thickness/2;
    context.beginPath();
    context.lineWidth = thickness;
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
    context.moveTo(fromx, fromy);
    context.lineTo(fromx+headlen*Math.cos(angle-Math.PI/6),fromy+headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(fromx, fromy);
    context.lineTo(fromx+headlen*Math.cos(angle+Math.PI/6),fromy+headlen*Math.sin(angle+Math.PI/6));
    context.stroke();
}


var onpremReporter = null;
var middleCloudReporter = null;
var leftCloudReporter = null;
var rightCloudReporter = null;
var parser = new DOMParser();
var xml = null;
var oldBottomLeftArrowSize = initThickness;
var oldVerticalArrowSize = initThickness;
var oldBottomRightArrowSize = initThickness;
var oldTopLeftArrowSize = initThickness;
var oldTopRightArrowSize = initThickness;
var oldHorizontalArrowSize = initThickness;

function incArrow(sizeBottomLeftArrow, sizeVerticalArrow, sizeBottomRightArrow, sizeTopLeftArrow, sizeTopRightArrow, sizeHorizontalArrow) {
  var context = document.getElementById("dynamic").getContext('2d');
  context.clearRect(0,0,dynamic.width, dynamic.height);
  bottomLeftArrowSize(context, sizeBottomLeftArrow);
  bottomRightArrowSize(context, sizeBottomRightArrow);
  verticalArrowSize(context, sizeVerticalArrow);
  topLeftArrowSize(context, sizeTopLeftArrow);
  topRightArrowSize(context, sizeTopRightArrow);
  horizontalArrowSize(context, sizeHorizontalArrow);
}
function topLeftArrowSize(context, size) {
    canvas_arrow(context, leftCloudX, leftCloudY - 2, topCloudLeftX, topCloudLeftY, size);
}
function topRightArrowSize(context, size) {
    canvas_arrow(context, topCloudRightX, topCloudRightY, rightCloudX, rightCloudY - 2, size);
}
function bottomLeftArrowSize(context, size) {
    canvas_arrow(context, leftCloudX, leftCloudY + 2, bottomDCLeftX, bottomDCLeftY, size);
}
function verticalArrowSize(context, size) {
    canvas_arrow(context, topCloudMiddleX, topCloudMiddleY, bottomDCMiddleX, bottomDCMiddleY, size);
}
function horizontalArrowSize(context, size) {
    canvas_arrow(context, leftCloudX, leftCloudY, rightCloudX, rightCloudY, size);
}
function bottomRightArrowSize(context, size) {
    canvas_arrow(context, bottomDCRightX, bottomDCRightY, rightCloudX, rightCloudY + 2, size);
}

function initMeshReporter() {
  //Create a reporter for every broker that needs querying for stats
  onpremReporter = new RateReporter();
  onpremReporter.setSolaceLoglevel(solace.LogLevel.WARN);
//   onpremReporter.setSolaceLoglevel(solace.LogLevel.DEBUG);
  onpremReporter.createSolaceFactory();
  onpremReporter.setUrl(onprem_url);
  onpremReporter.setVpnName(onprem_vpn);
  onpremReporter.setUserName(onprem_usr);
  onpremReporter.setPassword(onprem_pass);
  onpremReporter.setPhysicalName(onprem_vrouter);
  onpremReporter.setVersion("soltr/" + onprem_version);
  //Add the name of each bridge that needs checking and add switch statement for each
  onpremReporter.addBridgeName(bottomLeftArrowVpnBridgeName);
  onpremReporter.addBridgeName(verticalArrowVpnBridgeName);
  onpremReporter.addBridgeName(bottomRightArrowVpnBridgeName);

  onpremReporter.setCb(function(bridgeName, rate) {
    //console.log("" + bridgeName);
    switch (bridgeName) {
      case bottomLeftArrowVpnBridgeName:
		    if ( rate != oldBottomLeftArrowSize ) {
			       console.log(bottomLeftArrowName + " Rate: " + rate);
             incArrow(rate, oldVerticalArrowSize, oldBottomRightArrowSize, oldTopLeftArrowSize, oldTopRightArrowSize, oldHorizontalArrowSize);
             oldBottomLeftArrowSize = rate;
       }
      break;
      case verticalArrowVpnBridgeName:
		    if ( rate != oldVerticalArrowSize ) {
			       console.log(verticalArrowName + " Rate: " + rate);
			       incArrow(oldBottomLeftArrowSize, rate, oldBottomRightArrowSize, oldTopLeftArrowSize, oldTopRightArrowSize, oldHorizontalArrowSize);
			       oldVerticalArrowSize = rate;
		    }
      break;
      case bottomRightArrowVpnBridgeName:
		    if ( rate != oldBottomRightArrowSize ) {
			       console.log(bottomRightArrowName + " Rate: " + rate);
			       incArrow(oldBottomLeftArrowSize, oldVerticalArrowSize, rate, oldTopLeftArrowSize, oldTopRightArrowSize, oldHorizontalArrowSize);
			       oldBottomRightArrowSize = rate;
		     }
      break;
    }
  });

  //Create a reporter for every broker that needs querying for stats
  middleCloudReporter = new RateReporter();
  middleCloudReporter.setSolaceLoglevel(solace.LogLevel.WARN);
//   middleCloudReporter.setSolaceLoglevel(solace.LogLevel.DEBUG);
  middleCloudReporter.createSolaceFactory();
  middleCloudReporter.setUrl(middlecloud_url);
  middleCloudReporter.setVpnName(middlecloud_vpn);
  middleCloudReporter.setUserName(middlecloud_usr);
  middleCloudReporter.setPassword(middlecloud_pass);
  middleCloudReporter.setPhysicalName(middlecloud_vrouter);
  middleCloudReporter.setVersion("soltr/" + middlecloud_version);
  //Add the name of each bridge that needs checking and add switch statement for each
  middleCloudReporter.addBridgeName(topLeftArrowVpnBridgeName);
  middleCloudReporter.addBridgeName(topRightArrowVpnBridgeName);

  middleCloudReporter.setCb(function(bridgeName, rate) {
    switch (bridgeName) {
      case topLeftArrowVpnBridgeName:
		    if ( rate != oldTopLeftArrowSize ) {
			       console.log(topLeftArrowName + " Rate: " + rate);
			       incArrow(oldBottomLeftArrowSize, oldVerticalArrowSize, oldBottomRightArrowSize, rate, oldTopRightArrowSize, oldHorizontalArrowSize);
			       oldTopLeftArrowSize = rate;
		    }
      break;
      case topRightArrowVpnBridgeName:
		    if ( rate != oldTopRightArrowSize ) {
			       console.log(topRightArrowName + " Rate: " + rate);
			       incArrow(oldBottomLeftArrowSize, oldVerticalArrowSize, oldBottomRightArrowSize, oldTopLeftArrowSize, rate, oldHorizontalArrowSize);
			       oldTopRightArrowSize = rate;
		    }
      break;
    }
  });

  //Create a reporter for every broker that needs querying for stats
  leftCloudReporter = new RateReporter();
  leftCloudReporter.setSolaceLoglevel(solace.LogLevel.WARN);
//   middleCloudReporter.setSolaceLoglevel(solace.LogLevel.DEBUG);
  leftCloudReporter.createSolaceFactory();
  leftCloudReporter.setUrl(leftcloud_url);
  leftCloudReporter.setVpnName(leftcloud_vpn);
  leftCloudReporter.setUserName(leftcloud_usr);
  leftCloudReporter.setPassword(leftcloud_pass);
  leftCloudReporter.setPhysicalName(leftcloud_vrouter);
  leftCloudReporter.setVersion("soltr/" + leftcloud_version);
  //Add the name of each bridge that needs checking and add switch statement for each
  leftCloudReporter.addBridgeName(horizontalArrowVpnBridgeName);

  leftCloudReporter.setCb(function(bridgeName, rate) {
    switch (bridgeName) {
      case horizontalArrowVpnBridgeName:
		    if ( rate != oldHorizontalArrowSize ) {
			       console.log(horizontalArrowName + " Rate: " + rate);
			       incArrow(oldBottomLeftArrowSize, oldVerticalArrowSize, oldBottomRightArrowSize, oldTopLeftArrowSize, oldTopRightArrowSize, rate);
			       oldHorizontalArrowSize = rate;
		    }
      break;
    }
  });

  //Create a reporter for every broker that needs querying for stats
  rightCloudReporter = new RateReporter();
  rightCloudReporter.setSolaceLoglevel(solace.LogLevel.WARN);
  //rightCloudReporter.setSolaceLoglevel(solace.LogLevel.DEBUG);
  rightCloudReporter.createSolaceFactory();
  rightCloudReporter.setUrl(rightcloud_url);
  rightCloudReporter.setVpnName(rightcloud_vpn);
  rightCloudReporter.setUserName(rightcloud_usr);
  rightCloudReporter.setPassword(rightcloud_pass);
  rightCloudReporter.setPhysicalName(rightcloud_vrouter);
  rightCloudReporter.setVersion("soltr/" + rightcloud_version);
  //Add the name of each bridge that needs checking and add switch statement for each
  //rightCloudReporter.addBridgeName(bottomRightArrowVpnBridgeName2);

  rightCloudReporter.setCb(function(bridgeName, rate) {
    switch (bridgeName) {
      case bottomRightArrowVpnBridgeName2:
		    if ( rate != oldBottomRightArrowSize ) {
			       console.log(bottomRightArrowName + " Rate: " + rate);
			       incArrow(oldBottomLeftArrowSize, oldVerticalArrowSize, rate, oldTopLeftArrowSize, oldTopRightArrowSize, oldHorizontalArrowSize);
			       oldBottomRightArrowSize = rate;
		     }
      break;
    }
  });


  // if secure connection, first load iframe so the browser can provide a client-certificate
   if (onprem_url.lastIndexOf('wss://', 0) === 0 || onprem_url.lastIndexOf('https://', 0) === 0) {
       var urlNoProto = onprem_url.split('/').slice(2).join('/'); // remove protocol prefix
       document.getElementById('iframe1').src = 'https://' + urlNoProto + '/crossdomain.xml';
   } else {
       onpremReporter.connect();
   }
   // if secure connection, first load iframe so the browser can provide a client-certificate
    if (middlecloud_url.lastIndexOf('wss://', 0) === 0 || middlecloud_url.lastIndexOf('https://', 0) === 0) {
        var urlNoProto = middlecloud_url.split('/').slice(2).join('/'); // remove protocol prefix
        document.getElementById('iframe2').src = 'https://' + urlNoProto + '/crossdomain.xml';
    } else {
        middleCloudReporter.connect();
    }
    // if secure connection, first load iframe so the browser can provide a client-certificate
     if (rightcloud_url.lastIndexOf('wss://', 0) === 0 || rightcloud_url.lastIndexOf('https://', 0) === 0) {
         var urlNoProto = rightcloud_url.split('/').slice(2).join('/'); // remove protocol prefix
         document.getElementById('iframe3').src = 'https://' + urlNoProto + '/crossdomain.xml';
     } else {
         rightCloudReporter.connect();
     }
     // if secure connection, first load iframe so the browser can provide a client-certificate
      if (leftcloud_url.lastIndexOf('wss://', 0) === 0 || leftcloud_url.lastIndexOf('https://', 0) === 0) {
          var urlNoProto = leftcloud_url.split('/').slice(2).join('/'); // remove protocol prefix
          document.getElementById('iframe4').src = 'https://' + urlNoProto + '/crossdomain.xml';
      } else {
          leftCloudReporter.connect();
      }
}

function connectMeshReporter() {
  if (onpremReporter) {
    onpremReporter.connect();
  }
  if (middleCloudReporter) {
    middleCloudReporter.connect();
  }
  if (leftCloudReporter) {
    leftCloudReporter.connect();
  }
  if (rightCloudReporter) {
    rightCloudReporter.connect();
  }
}
function disconnectMeshReporter() {
  if (onpremReporter) {
    onpremReporter.disconnect();
  }
  if (middleCloudReporter) {
    middleCloudReporter.disconnect();
  }
  if (leftCloudReporter) {
    leftCloudReporter.disconnect();
  }
  if (rightCloudReporter) {
    rightCloudReporter.disconnect();
  }
}
