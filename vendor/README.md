# Vendor and Warehouse Microservices

## Configurations

### parts_db.json

Json file for parts database

```json
{
    "vendorname":"car stuff inc.",
    "vendortype":"vnd", ## vnd / whs
    "parts": [
      {
        "type": "headlight",
        "model": "xbrite 1000",
        "cost":100.10,
        "available": true,
        "shipdays": 1,
        "shipcost": 50
      },
      {
        "type": "wheels",
        "model": "spinnerz",
        "cost":80.10,
        "available": true,
        "shipdays": 1,
        "shipcost": 50
      }      
    ]
  }
```

### application.properties

- json_path: json file to load parts database
- queueName: solace queue to bind.

## How to build it

```bash
gradle assemble
```

## How to run it

```
java -jar ./build/libs/vendor-0.0.1-SNAPSHOT.jar --spring.config.name=vendor01
```

This will ask the app to load the vendor01.properties file to read properties of the solace broker and the queue name to bind, and the parts json file.

## Output sample

```bash
> java -jar ./build/libs/vendor-0.0.1-SNAPSHOT.jar

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.1.5.RELEASE)

2019-05-30 11:42:38.009  INFO 89620 --- [           main] c.solace.geek3.vendor.VendorApplication  : Starting VendorApplication on mbp17.local with PID 89620 (/Users/ichen/devprojects/geek3/vendor/build/libs/vendor-0.0.1-SNAPSHOT.jar started by ichen in /Users/ichen/devprojects/geek3/vendor)
2019-05-30 11:42:38.012 DEBUG 89620 --- [           main] c.solace.geek3.vendor.VendorApplication  : Running with Spring Boot v2.1.5.RELEASE, Spring v5.1.7.RELEASE
2019-05-30 11:42:38.012  INFO 89620 --- [           main] c.solace.geek3.vendor.VendorApplication  : No active profile set, falling back to default profiles: default
2019-05-30 11:42:38.522  INFO 89620 --- [           main] com.solace.geek3.vendor.VendorProcessor  : Loading parts database from: parts_db.json
2019-05-30 11:42:38.545  INFO 89620 --- [           main] com.solace.geek3.vendor.VendorProcessor  :
{
    "vendorname": "car stuff inc.",
    "vendortype": "vnd",
    "parts": [
        {
            "type": "headlight",
            "model": "xbrite 1000",
            "cost": 100.10,
            "available": true,
            "shipdays": 1,
            "shipcost": 50
        },
        {
            "type": "wheels",
            "model": "spinnerz",
            "cost": 80.10,
            "available": true,
            "shipdays": 1,
            "shipcost": 50
        }
    ]
}
2019-05-30 11:42:39.013  INFO 89620 --- [           main] c.solace.geek3.vendor.VendorApplication  : Started VendorApplication in 1.41 seconds (JVM running for 1.838)
2019-05-30 11:42:39.127  INFO 89620 --- [           main] c.s.j.protocol.impl.TcpClientChannel     : Connecting to host 'orig=tcp://127.0.0.1:55555, scheme=tcp://, host=127.0.0.1, port=55555' (host 1 of 1, smfclient 2, attempt 1 of 1, this_host_attempt: 1 of 21)
2019-05-30 11:42:39.168  INFO 89620 --- [           main] c.s.j.protocol.impl.TcpClientChannel     : Connected to host 'orig=tcp://127.0.0.1:55555, scheme=tcp://, host=127.0.0.1, port=55555' (smfclient 2)
2019-05-30 11:42:39.197  INFO 89620 --- [           main] c.s.g.vendor.VendorApplication$Runner    : Attempting to bind to the queue 'vendor_queue' on the broker.
2019-05-30 11:42:39.216  INFO 89620 --- [           main] c.s.g.vendor.VendorApplication$Runner    : Connected. Awaiting message...
2019-05-30 11:42:47.540 DEBUG 89620 --- [sumerDispatcher] c.s.geek3.vendor.VendorMessageConsumer   : ============= Received message from 'tutorial/topic':
{
    "vin": "1G1JC1444PZ215071",
    "parts": [
      {
        "type": "headlight",
        "model": "xbrite 1000"
      },
      {
        "type": "wheels",
        "model": "spinnerz"
      }    ]
}

2019-05-30 11:42:47.594 DEBUG 89620 --- [sumerDispatcher] c.s.geek3.vendor.VendorMessageConsumer   : ============= Sending msg to topic 'vnd/part/avail/res':
{
    "vendorname": "car stuff inc.",
    "vin": "1G1JC1444PZ215071",
    "parts": [
        {
            "type": "headlight",
            "model": "xbrite 1000",
            "cost": 100.10,
            "available": true,
            "shipdays": 1,
            "shipcost": 50
        },
        {
            "type": "wheels",
            "model": "spinnerz",
            "cost": 80.10,
            "available": true,
            "shipdays": 1,
            "shipcost": 50
        }
    ]
}
2019-05-30 11:42:47.608  INFO 89620 --- [ducerDispatcher] c.s.geek3.vendor.PublishEventHandler     : Producer received response for msg: 2
```