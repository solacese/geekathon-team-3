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
public class OMSApplication {

    public static void main(String[] args) {
        SpringApplication.run(OMSApplication.class, args);
    }

    @Component
    static class Runner implements CommandLineRunner {

        private static final Logger logger = LoggerFactory.getLogger(Runner.class);

        @Value("${mgr_order_estimate_queue}")
        private String mgr_order_estimate_queue;
        
        @Value("${part_avail_res_queue}")
        private String part_avail_res_queue;
                
        @Autowired private OrderReqConsumer orderReqConsumer;
        @Autowired private PartAvailConsumer partAvailConsumer;
        @Autowired private SolaceService solaceService;
        
        
        private CountDownLatch latch = new CountDownLatch(1);


        @Override
        public void run(String... strings) throws Exception {

        	solaceService.subscribeOnQueue(mgr_order_estimate_queue, orderReqConsumer);
        	solaceService.subscribeOnQueue(part_avail_res_queue, partAvailConsumer);

            try {
                // block here
                latch.await();
            } catch (InterruptedException e) {
                logger.error("I was awoken while waiting");
            }

            logger.info("Exiting.");
            solaceService.close();
        }
    }
}
