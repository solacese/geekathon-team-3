# create a mgr_order_estimate_queue
curl -X POST -u admin:admin http://localhost:8080/SEMP/v2/config/msgVpns/default/queues \
-H "content-type: application/json" -d '
{
    "queueName": "mgr_order_estimate_queue",
    "egressEnabled": true,
    "ingressEnabled": true,
    "permission": "consume"
}'

# create a "topic to queue" subscriptions
curl -X POST -u admin:admin http://localhost:8080/SEMP/v2/config/msgVpns/default/queues/mgr_order_estimate_queue/subscriptions \
-H "content-type: application/json" -d '
{
    "subscriptionTopic": "mgr/vehicle/*/order/new/estimate"
}'

# create a part_avail_res_queue
curl -X POST -u admin:admin http://localhost:8080/SEMP/v2/config/msgVpns/default/queues \
-H "content-type: application/json" -d '
{
    "queueName": "part_avail_res_queue",
    "egressEnabled": true,
    "ingressEnabled": true,
    "permission": "consume"
}'

# create a "topic to queue" subscriptions
curl -X POST -u admin:admin http://localhost:8080/SEMP/v2/config/msgVpns/default/queues/part_avail_res_queue/subscriptions \
-H "content-type: application/json" -d '
{
    "subscriptionTopic": "*/part/avail/res"
}'
