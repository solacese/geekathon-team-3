var leftIconX = "320px";
var leftIconY = "255px";
var rightIconX = "1680px";
var rightIconY = "250px";
var topIconX = "1080px";
var topIconY = "125px";
var bottomIconX = "960px";
var bottomIconY = "190px";

var rightcloud = document.getElementById("rightcloud");
if ( rightcloud !== null ) {
	rightcloud.style.position = "absolute";
	rightcloud.style.top = rightIconY;
	rightcloud.style.left = rightIconX;
	var elem = document.createElement("img");
	elem.setAttribute("src", rightcloud_icon);
	elem.setAttribute("alt", "right-cloud");
	elem.setAttribute("height", "30");
	elem.setAttribute("width","52");
	rightcloud.appendChild(elem);
}

var middlecloud = document.getElementById("middlecloud");
if ( middlecloud !== null ) {
	middlecloud.style.position = "absolute";
	middlecloud.style.top = topIconY;
	middlecloud.style.left = topIconX;
	var elem = document.createElement("img");
	elem.setAttribute("src", middlecloud_icon);
	elem.setAttribute("alt", "middle-cloud");
	elem.setAttribute("height", "30");
	elem.setAttribute("width","30");
	middlecloud.appendChild(elem);
}

var leftcloud = document.getElementById("leftcloud");
if ( leftcloud !== null ) {
	leftcloud.style.position = "absolute";
	leftcloud.style.top = leftIconY;
	leftcloud.style.left = leftIconX;
	var elem = document.createElement("img");
	elem.setAttribute("src", leftcloud_icon);
	elem.setAttribute("alt", "left-cloud");
	elem.setAttribute("height", "30");
	elem.setAttribute("width","45");
	leftcloud.appendChild(elem);
}

var onprem = document.getElementById("onprem");
if ( onprem !== null ) {
	onprem.style.position = "absolute";
	onprem.style.top = bottomIconY;
	onprem.style.left = bottomIconX;
	var elem = document.createElement("img");
	elem.setAttribute("src", onprem_icon);
	elem.setAttribute("alt", "onprem");
	elem.setAttribute("height", "30");
	elem.setAttribute("width","30");
	onprem.appendChild(elem);
}

