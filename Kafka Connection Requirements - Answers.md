**Kafka Connection Requirements**  
To establish a connection with the Kafka queue and consume data, we require the following details**:**  
**Connection Details**  
• **Brokers**: broker-exposed.command.verot.dev.vdp.vero.host:443  
• **Group ID**: You determine this. It’s unique to the clients as you should be aware 🤔You’re going to be the only consumer of these messages so there should be no conflict.  
• **Topics**: Three topics, contents of which are self-explanatory:

* vdp.v1.postcomment  
* vdp.v1.postlike  
* vdp.v1.userfollowing

• **Auto Offset Reset**: Again this is client specific… you will need to work this out but initially I would assume you would go with earliest and then you want to change to be latest committed offset.  
• **Session Timeout**: Client specific AFAIK.

**Security & Authentication**  
• **Security Protocols**: TLS  
• **SASL Mechanism**: N/A  
• **SASL Username**: N/A  
• **SASL Password**: N/A  
• **SSL Mode**: SSL/TLS \- Jakub can provide you with a script you use to generate the certificates from vault that you will use to connect to the broker.  
**Serialization & Data Format**  
• **Schema Registry**: No  
• **Deserialization Code Sample**: This is client dependent. What are you going to be using?  
• **Apache Avro Usage**: No, messages are in protobuf format. The files can be found here: [https://gitlab.prd.aws.vero.host/digidev/protobuf-files](https://gitlab.prd.aws.vero.host/digidev/protobuf-files)

