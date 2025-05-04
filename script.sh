#!/bin/bash

mkdir -p src/communication/kafka/{config,utils,logger,types}
mkdir -p src/communication/kafka/infrastructure/{connection,repositories}
mkdir -p src/communication/kafka/{services,dto}
mkdir -p src/communication/kafka/processing/{handlers,pipelines}
mkdir -p src/communication/kafka/preprocessing/deserializers
mkdir -p src/communication/kafka/{consumers,processors}

echo "Kafka folder structure created successfully."
