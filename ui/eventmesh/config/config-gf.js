onprem_alias = "Boulogne-Billancourt (On-prem)";
onprem_url = "ws://london.solace.com:1880";
onprem_vrouter = "london-lab-eventmesh";
onprem_version = "9_0_1";
onprem_vpn = "eventMesh";
onprem_icon = "images/dc-icon.png";

middlecloud_alias = "Ice Racer (Google Cloud)";
middlecloud_url = "ws://35.210.75.228:80";
middlecloud_vrouter = "gcevmr";
middlecloud_version = "9_0VMR";
middlecloud_vpn = "eventMesh";
middlecloud_icon = "images/gce-icon.png";

rightcloud_alias = "Tokyo Drift (AWS)";
rightcloud_url = "ws://ec2-52-195-11-219.ap-northeast-1.compute.amazonaws.com:80";
rightcloud_vrouter = "aws-apac";
rightcloud_version = "9_1VMR";
rightcloud_vpn = "eventMesh";
rightcloud_icon = "images/aws-icon.png";

leftcloud_alias = "West Coast Customs (Azure)";
leftcloud_url = "ws://azurevmr.westeurope.cloudapp.azure.com:80";
leftcloud_vrouter = "204770af3510";
leftcloud_version = "9_0VMR";
leftcloud_vpn = "eventMesh";
leftcloud_icon = "images/azure-icon.png";

//For DMR
//bridges = #cluster/:<remote-router>
//clients = #bridge/local/#cluster:<remote-router>/<local-router>/<id>/<id>

bottomRightArrowName = "Boulogne-Billancourt <-> Tokyo Drift";
bottomRightArrowVpnBridgeName = "#cluster:aws-apac"; //from onprem
verticalArrowName = "Boulogne-Billancourt <-> Ice Racer";
verticalArrowVpnBridgeName = "#cluster:gcevmr"; //from onprem
bottomLeftArrowName = "Boulogne-Billancourt <-> West Coast Customs";
bottomLeftArrowVpnBridgeName = "#cluster:204770af3510"; //from onprem
topRightArrowName = "Ice Racer <-> Tokyo Drift";
topRightArrowVpnBridgeName = "#cluster:aws-apac"; //from middle cloud
topLeftArrowName = "West Coast Customs <-> Ice Racer";
topLeftArrowVpnBridgeName = "#cluster:204770af3510"; //from middle cloud
horizontalArrowName = "West Coast Customs <-> Tokyo Drift";
horizontalArrowVpnBridgeName = "#cluster:aws-apac"; //from left cloud
serviceClientNames = "winchester/*/#00000001/*"
