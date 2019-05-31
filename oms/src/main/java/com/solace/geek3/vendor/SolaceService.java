package com.solace.geek3.vendor;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.solacesystems.jcsmp.ConsumerFlowProperties;
import com.solacesystems.jcsmp.DeliveryMode;
import com.solacesystems.jcsmp.EndpointProperties;
import com.solacesystems.jcsmp.FlowReceiver;
import com.solacesystems.jcsmp.InvalidPropertiesException;
import com.solacesystems.jcsmp.JCSMPFactory;
import com.solacesystems.jcsmp.JCSMPProperties;
import com.solacesystems.jcsmp.JCSMPSession;
import com.solacesystems.jcsmp.Queue;
import com.solacesystems.jcsmp.SpringJCSMPFactory;
import com.solacesystems.jcsmp.TextMessage;
import com.solacesystems.jcsmp.Topic;
import com.solacesystems.jcsmp.XMLMessageListener;
import com.solacesystems.jcsmp.XMLMessageProducer;

@Service
public class SolaceService {
    private static final Logger logger = LoggerFactory.getLogger(SolaceService.class);

    @Autowired private SpringJCSMPFactory solaceFactory;
    private JCSMPSession session;
    private XMLMessageProducer prod;
    private PublishEventHandler pubEventHandler = new PublishEventHandler();

    @PostConstruct
    private void init() throws Exception {
    	session = solaceFactory.createSession();
        session.connect();
        /** Anonymous inner-class for handling publishing events */
        prod = session.getMessageProducer(pubEventHandler);
    	
    }
    
    public void close() {
    	session.closeSession();
    }
    
    public void subscribeOnQueue(String queueName, XMLMessageListener listener) throws Exception{
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
    
    public void sendMsg(String msg, String topic_name) throws Exception{
        Topic topic = JCSMPFactory.onlyInstance().createTopic(topic_name);
        TextMessage jcsmpMsg = JCSMPFactory.onlyInstance().createMessage(TextMessage.class);
        jcsmpMsg.setText(msg);
        jcsmpMsg.setDeliveryMode(DeliveryMode.PERSISTENT);

        logger.debug("============= Sending msg to topic '{}':{}", topic, msg);
        prod.send(jcsmpMsg, topic);
    }

}
