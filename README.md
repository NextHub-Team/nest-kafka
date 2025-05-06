<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

# Kafka Module Overview

This module implements a **Dedicated Topic Service** pattern using Kafka with NestJS. Each service handles one topic with its own consumer group, allowing independent scaling and clean separation of concerns.

---

## 📁 Directory Structure

```bash
src/communication/kafka
├── config
│   ├── kafka.config.ts              # Loads and validates Kafka environment variables
│   └── kafka-config.type.ts         # Type definitions for Kafka configuration
├── logger
│   ├── kafka-logger.decorator.ts    # NestJS-compatible logger decorator for Kafka messages
│   └── kafka-logger.ts              # Logger class for handling Kafka logs and events
├── types
│   ├── kafa-const.enum.ts           # Enumerations for default config values
│   ├── kafa-const.type.ts           # Constants and fallback defaults
│   └── kafka-interface.type.ts      # Shared interface types used across Kafka consumers
├── utils                            # Utility functions/helpers (optional)
├── kafka.consumer.ts                # Main consumer logic (create and consume topic messages)
├── kafka.module.ts                  # KafkaModule that registers all providers
├── kafka.processor.ts               # Handles actual business logic for messages
└── kafka.service.ts                 # Service to initialize and shutdown Kafka consumer
```

---

## 📦 Features

* ✅ Dedicated consumer instance per topic
* ✅ One consumer group per topic
* ✅ Auto reconnect and retry on failure
* ✅ Configurable SSL, partitions, commit settings
* ✅ Clean and minimal structure (no over-splitting)
* ✅ Pluggable processor logic per topic
* ✅ Scalable per service (Kubernetes-ready)

---

## 🎯 Kafka Consumption Strategy

### **Dedicated Topic Service**

* 🧩 One service = one topic
* 🧵 One Kafka consumer per service
* 📊 Each topic has its **own group ID**
* 📈 Microservice pattern, allows **independent scaling**
* 🛠️ Ideal for Kubernetes deployments with different replica counts

### Diagram

![Kafka Dedicated Topic Service Diagram](/mnt/data/A_2D_digital_diagram_illustrates_a_Kafka-based_mic.png)

---

## 🛠️ Design Pattern

* NestJS Modules: Encapsulation via `KafkaModule`
* Dependency Injection: For consumer, config, and logger
* Clean Code: Limited file count, single-responsibility design
* Observable: Ready for metrics/logging/health checks

---

## 🚀 Quickstart

```ts
// kafka.module.ts
@Module({
  providers: [KafkaService, KafkaProcessor, KafkaLogger, KafkaConfig],
})
export class KafkaModule {}

// app.module.ts
@Module({
  imports: [KafkaModule],
})
export class AppModule {}
```

---

## ✅ Good Practices

* One consumer group per topic
* Avoid mixing topics in one app
* Always handle errors and retries
* Ensure offset commits after processing

---

Feel free to scale each Kafka microservice independently based on load!
