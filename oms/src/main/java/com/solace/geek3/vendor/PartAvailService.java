package com.solace.geek3.vendor;

import java.io.StringReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonReader;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PartAvailService {
    private static final Logger logger = LoggerFactory.getLogger(PartAvailService.class);

    @Value("${oms_part_avail_req_topic}")
    private String oms_part_avail_req_topic;
    
    @Value("${max_vendor_numbers}")
    private int max_vendor_numbers;
    
    @Autowired private SolaceService solaceService;
    Map<String, PartAvail> ongoingAvailMap = Collections.synchronizedMap(new HashMap<>());
    
    private AtomicInteger order_id = new AtomicInteger(0);
    
	public void startCheck(String req) {
        JsonReader jsonReader = Json.createReader(new StringReader(req)); 
        JsonObject request = jsonReader.readObject();
        
        String vin = request.getString("vin");
		PartAvail partAvail = new PartAvail(vin);
		ongoingAvailMap.put(vin, partAvail);
    	logger.debug("Start checking Availablity: {}", partAvail.toString());
	}
	
	public void checkAvail(String avail_str) {
        JsonReader jsonReader = Json.createReader(new StringReader(avail_str)); 
        JsonObject aval_json = jsonReader.readObject();
        
        String vin = aval_json.getString("vin");
        String vendortype = aval_json.getString("vendortype");

        if (!ongoingAvailMap.containsKey(vin)) {
        	// drop the res without correlated vin
        	return;
        }
        
        // calculate the cost of current res
        JsonArray aval_parts = aval_json.getJsonArray("parts");
        double new_cost = aval_parts.stream()
        	.map(p -> p.asJsonObject().getJsonNumber("shipdays").doubleValue()*
        			p.asJsonObject().getJsonNumber("shipcost").doubleValue())
        	.reduce(0.0, Double::sum);
        
        if (new_cost <= 0.0) {
        	// Illegal response
        	logger.debug("Illegal response with cost<=0.0: {}", avail_str);
        	return;
        }

        if (vendortype.equalsIgnoreCase("whs")) {
        	// Warehouse is always preferred
        	logger.debug("Warehouse is always preferred");
        	sendRes(vin, avail_str);
        	return;
        }
        
        PartAvail prevPartAvail = ongoingAvailMap.get(vin);
    	prevPartAvail.checkTimes += 1;
        if(new_cost < prevPartAvail.shipping_cost) {
        	prevPartAvail.shipping_cost = new_cost;
        	prevPartAvail.avail_str = avail_str;
        	logger.debug("Adding less cost parts: {}", prevPartAvail.toString());
        }
        // updated the item with new checkTimes
    	ongoingAvailMap.put(vin, prevPartAvail);
        
        if (prevPartAvail.checkTimes >= max_vendor_numbers) {
        	// has received all vendor's response
        	logger.debug("Received {} vendor's responses, will send response...", prevPartAvail.checkTimes);
        	sendRes(vin, prevPartAvail.avail_str);
        }
        
	}
	
	private void sendRes(String vin, String avail_str) {
    	String topic_name = String.format("oms/vehicle/%s/order/%09d/cost", 
    			vin, order_id.addAndGet(1));
    	try {
        	solaceService.sendMsg(avail_str, topic_name);
    	}catch(Exception e) {
    		e.printStackTrace();
    	}
    	// remove replied response
    	ongoingAvailMap.remove(vin);
	}
	
	class PartAvail {
		public String vin;
		public LocalDateTime	request_time;
		public double shipping_cost = Double.MAX_VALUE;
		public String avail_str;
		public int checkTimes = 0;
		
		public PartAvail(String vin) {
			this.vin = vin;
			request_time = LocalDateTime.now();
		}
		
		@Override
		public String toString() {
			return "PartAvail[vin="+vin+", cost="+shipping_cost+
					", checkTimes="+checkTimes+", avail_str="+
					avail_str+"]";
		}
	}
}
