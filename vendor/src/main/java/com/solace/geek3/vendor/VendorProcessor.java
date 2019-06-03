package com.solace.geek3.vendor;

import java.io.FileReader;
import javax.json.stream.JsonGenerator;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Collections;

import javax.annotation.PostConstruct;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonValue;
import javax.json.JsonWriter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@Validated
public class VendorProcessor {
    private static final Logger logger = LoggerFactory.getLogger(VendorProcessor.class);

    @Value("${json_path}")
    private String json_path;
    
    private String res_topic;
    
    private String vendorname;
    private String vendortype;
    private JsonArray parts_db;

    @PostConstruct
    public void load() throws Exception{
        logger.info("Loading parts database from: {}", json_path);
        JsonReader jsonReader = Json.createReader(new FileReader(json_path)); 
        JsonObject vendor = jsonReader.readObject();

        StringWriter sw = new StringWriter();
        JsonWriter writer = Json.createWriterFactory(
        		Collections.singletonMap(JsonGenerator.PRETTY_PRINTING, "true"))
        		.createWriter(sw);
        writer.writeObject(vendor);
        writer.close();
        logger.info(sw.toString());
        
        
        vendorname = vendor.getString("vendorname");
        vendortype = vendor.getString("vendortype");
        res_topic = vendortype+"/part/avail/res";
        parts_db = vendor.getJsonArray("parts");
    }

    public String getResTopic() {
    	return res_topic;
    }
    
    public String process(String req){
        JsonReader jsonReader = Json.createReader(new StringReader(req)); 
        JsonObject request = null;
		try {
			request = jsonReader.readObject();

            JsonArrayBuilder res_parts_builder = Json.createArrayBuilder();
            JsonArray req_parts = request.getJsonArray("parts");
            for (JsonValue jsonVal : req_parts) {
                String type = jsonVal.asJsonObject().getString("type");
//                String model = jsonVal.asJsonObject().getString("model");
                JsonObject part = queryParts(type, "model");
                if(part != null){
                    res_parts_builder.add(part);
                }
            }
            JsonObject res = Json.createObjectBuilder()
                .add("vin", request.getString("vin"))
                .add("vendorname", vendorname)
                .add("vendortype", vendortype)
                .add("parts", res_parts_builder)
                .build();

            StringWriter sw = new StringWriter();
            JsonWriter writer = Json.createWriterFactory(
            		Collections.singletonMap(JsonGenerator.PRETTY_PRINTING, "true"))
            		.createWriter(sw);
            writer.writeObject(res);
            writer.close();
            
            return sw.toString();            
        } catch (Exception e) {
        	e.printStackTrace();
            return "{}";
        }
    }

    private JsonObject queryParts(String type, String model){
        for (JsonValue jsonVal : parts_db) {
            JsonObject part = jsonVal.asJsonObject();
            if(type.equalsIgnoreCase(part.getString("type"))){
                    return part;
                }
        }

        return null;
    }
}