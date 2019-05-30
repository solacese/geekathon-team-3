package com.solace.geek3.vendor;

import java.util.concurrent.CountDownLatch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;

import com.solacesystems.jcsmp.JCSMPFactory;
import com.solacesystems.jcsmp.JCSMPSession;
import com.solacesystems.jcsmp.SpringJCSMPFactory;
import com.solacesystems.jcsmp.XMLMessageProducer;

import com.solacesystems.jcsmp.Queue;
import com.solacesystems.jcsmp.JCSMPProperties;
import com.solacesystems.jcsmp.ConsumerFlowProperties;
import com.solacesystems.jcsmp.EndpointProperties;
import com.solacesystems.jcsmp.FlowReceiver;
import com.solacesystems.jcsmp.XMLMessageListener;


@SpringBootApplication
public class VendorApplication {

    public static void main(String[] args) {
        SpringApplication.run(VendorApplication.class, args);
    }

    @Component
    static class Runner implements CommandLineRunner {

        private static final Logger logger = LoggerFactory.getLogger(Runner.class);

        @Autowired private SpringJCSMPFactory solaceFactory;

        @Value("${queueName}")
        private String queueName;
        private XMLMessageProducer prod = null;
        @Autowired private VendorMessageConsumer msgConsumer;
        private PublishEventHandler pubEventHandler = new PublishEventHandler();

        private CountDownLatch latch = new CountDownLatch(1);


        private void subscribeOnQueue(JCSMPSession session, String queueName, XMLMessageListener listener) throws Exception{
            final Queue queue = JCSMPFactory.onlyInstance().createQueue(queueName);
            logger.info("Attempting to bind to the queue '{}' on the broker.", queueName);
    
            // Create a Flow be able to bind to and consume messages from the Queue.
            final ConsumerFlowProperties flow_prop = new ConsumerFlowProperties();
            flow_prop.setEndpoint(queue);
            flow_prop.setAckMode(JCSMPProperties.SUPPORTED_MESSAGE_ACK_AUTO);
    
            EndpointProperties endpoint_props = new EndpointProperties();
            endpoint_props.setAccessType(EndpointProperties.ACCESSTYPE_EXCLUSIVE);
    
            final FlowReceiver cons = session.createFlow(listener, flow_prop, endpoint_props);
    
            logger.info("Connected. Awaiting message...");
            cons.start();
        }

        @Override
        public void run(String... strings) throws Exception {
            final JCSMPSession session = solaceFactory.createSession();
            session.connect();
            /** Anonymous inner-class for handling publishing events */
            prod = session.getMessageProducer(pubEventHandler);
            msgConsumer.setProducer(prod);

            subscribeOnQueue(session, queueName, msgConsumer);

            try {
                // block here
                latch.await();
            } catch (InterruptedException e) {
                logger.error("I was awoken while waiting");
            }

            logger.info("Exiting.");
            session.closeSession();
        }
    }
}
