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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.solacesystems.jcsmp.BytesXMLMessage;
import com.solacesystems.jcsmp.JCSMPException;
import com.solacesystems.jcsmp.TextMessage;
import com.solacesystems.jcsmp.XMLContentMessage;
import com.solacesystems.jcsmp.XMLMessageListener;
import com.solacesystems.jcsmp.XMLMessageProducer;

@Component
public class PartAvailConsumer implements XMLMessageListener {

    private static final Logger logger = LoggerFactory.getLogger(PartAvailConsumer.class);
    private XMLMessageProducer prod = null;
    
    @Autowired private PartAvailService partAvailService;
    @Autowired private SolaceService solaceService;

    @Override
    public void onReceive(BytesXMLMessage msg) {
        String vendor = null;
        if (msg instanceof TextMessage) {
            vendor = ((TextMessage) msg).getText();
        } else if(msg instanceof XMLContentMessage){
            vendor = ((XMLContentMessage) msg).getXMLContent();
        }
        
        if (vendor == null) {
            logger.debug("============= Received unknow message from '{}':\n{}",
            		msg.getDestination().getName(), msg.dump());
        } else {
            partAvailService.checkAvail(vendor);
        }
    }

    @Override
    public void onException(JCSMPException e) {
        logger.info("Consumer received exception:", e);
    }
}
