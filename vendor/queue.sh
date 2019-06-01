#!/bin/bash
export SOL_HOST=http://azurevmr.westeurope.cloudapp.azure.com:8080
export SOL_VPN=eventMesh
export SOL_ADMIN=geekfestAdmin
export SOL_PWD=SanDiego!

queue_json='
{
    "queueName": "xxxx",
    "egressEnabled": true,
    "ingressEnabled": true,
    "permission": "consume"
}'

set -o xtrace
curl -X POST -u $SOL_ADMIN:$SOL_PWD $SOL_HOST/SEMP/v2/config/msgVpns/$SOL_VPN/queues \
-H "content-type: application/json" -d "${queue_json/xxxx/$1}"

# create a "topic to queue" subscriptions
curl -X POST -u $SOL_ADMIN:$SOL_PWD $SOL_HOST/SEMP/v2/config/msgVpns/$SOL_VPN/queues/$1/subscriptions \
-H "content-type: application/json" -d '
{
    "subscriptionTopic": "mgr/vehicle/*/order/new/estimate"
}'
