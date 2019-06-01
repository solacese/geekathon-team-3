#!/bin/bash
export SOL_HOST=http://localhost:8080
export SOL_VPN=default
export SOL_ADMIN=admin
export SOL_PWD=admin

# create a mgr_order_estimate_queue
curl -X POST -u $SOL_ADMIN:$SOL_PWD $SOL_HOST/SEMP/v2/config/msgVpns/$SOL_VPN/queues \
-H "content-type: application/json" -d '
{
    "queueName": "mgr_order_estimate_queue",
    "egressEnabled": true,
    "ingressEnabled": true,
    "permission": "consume"
}'

# create a "topic to queue" subscriptions
curl -X POST -u $SOL_ADMIN:$SOL_PWD $SOL_HOST/SEMP/v2/config/msgVpns/$SOL_VPN/queues/mgr_order_estimate_queue/subscriptions \
-H "content-type: application/json" -d '
{
    "subscriptionTopic": "mgr/vehicle/*/order/new/estimate"
}'

# create a part_avail_res_queue
curl -X POST -u $SOL_ADMIN:$SOL_PWD $SOL_HOST/SEMP/v2/config/msgVpns/$SOL_VPN/queues \
-H "content-type: application/json" -d '
{
    "queueName": "part_avail_res_queue",
    "egressEnabled": true,
    "ingressEnabled": true,
    "permission": "consume"
}'

# create a "topic to queue" subscriptions
curl -X POST -u $SOL_ADMIN:$SOL_PWD $SOL_HOST/SEMP/v2/config/msgVpns/$SOL_VPN/queues/part_avail_res_queue/subscriptions \
-H "content-type: application/json" -d '
{
    "subscriptionTopic": "*/part/avail/res"
}'
