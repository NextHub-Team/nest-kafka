#!/bin/bash
rm -rf ./server/grpc/protos/generated && mkdir -p ./server/grpc/protos/generated && npx grpc_tools_node_protoc \
--proto_path=server/grpc/protos \
--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
--ts_opt=json_names \
--ts_out=./server/grpc/protos/generated \
--grpc_out=grpc_js:./server/grpc/protos/generated \
--js_out=import_style=commonjs,binary:./server/grpc/protos/generated \
-I ./server/grpc/protos \
$(find server/grpc/protos -name "*.proto")
