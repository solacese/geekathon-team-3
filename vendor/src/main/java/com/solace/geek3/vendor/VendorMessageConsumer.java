/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package com.solace.geek3.vendor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.solacesystems.jcsmp.DeliveryMode;
import com.solacesystems.jcsmp.JCSMPFactory;
import com.solacesystems.jcsmp.TextMessage;
import com.solacesystems.jcsmp.XMLContentMessage;
import com.solacesystems.jcsmp.Topic;
import com.solacesystems.jcsmp.BytesXMLMessage;
import com.solacesystems.jcsmp.JCSMPException;
import com.solacesystems.jcsmp.XMLMessageProducer;
import com.solacesystems.jcsmp.XMLMessageListener;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class VendorMessageConsumer implements XMLMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(VendorMessageConsumer.class);
    private XMLMessageProducer prod = null;

    @Autowired private VendorProcessor processor;

    public  void setProducer(XMLMessageProducer prod) throws Exception {
        this.prod = prod;
    }

    private void sendMsg(String msg, String topic_name) throws Exception{
        Topic topic = JCSMPFactory.onlyInstance().createTopic(topic_name);
        TextMessage jcsmpMsg = JCSMPFactory.onlyInstance().createMessage(TextMessage.class);
        jcsmpMsg.setText(msg);
        jcsmpMsg.setDeliveryMode(DeliveryMode.PERSISTENT);

        logger.debug("============= Sending msg to topic '{}':{}", topic, msg);
        prod.send(jcsmpMsg, topic);
    }


    @Override
    public void onReceive(BytesXMLMessage msg) {
        String req = "{}";
        String res="{}";
        if (msg instanceof TextMessage) {
            req = ((TextMessage) msg).getText();
        } else if(msg instanceof XMLContentMessage){
            req = ((XMLContentMessage) msg).getXMLContent();
        }
        
        logger.debug("============= Received message from '{}':\n{}", msg.getDestination().getName(), req);
        res = processor.process(req);

        try {
            sendMsg(res, processor.getResTopic());
        } catch(Exception e){
            e.printStackTrace();
        }
    }

    @Override
    public void onException(JCSMPException e) {
        logger.info("Consumer received exception:", e);
    }
}
