# VTEX-Kafka Event Processing Service

This project provides a reference implementation for a decoupled and scalable architecture to asynchronously process VTEX events using Node.js and Apache Kafka.

It consists of a **Producer** service that ingests events via an HTTP endpoint and a **Consumer** service that processes these events from a Kafka topic.

## Architecture Overview

The data flows through the system as follows:

```
[VTEX Webhook] -> [HTTP POST] -> [Producer API (producer.js)] -> [Kafka Topic: 'vtex-orders'] -> [Consumer Service (consumer.js)] -> [Your Business Logic]
```

### Key Features

*   **Decoupled Architecture**: The producer (event ingestion) and consumer (event processing) are independent, improving system resilience and maintainability.
*   **Scalability**: Multiple consumer instances can be deployed to process messages in parallel, increasing throughput.
*   **Message Ordering**: By using the `orderId` as the Kafka message key, we ensure that all events related to the same order are processed sequentially by the same consumer partition.
*   **Local Development Environment**: Includes a `docker-compose.yml` to easily spin up a local Kafka and Zookeeper instance.

## Prerequisites

Ensure you have the following installed on your local machine:

*   Node.js (v16+ recommended)
*   Docker
*   Docker Compose

## Getting Started

Follow these steps to get the application running locally.

### 1. Install Dependencies

Navigate to the project root and install the required npm packages.

```bash
npm install
```

### 2. Start the Infrastructure

Use Docker Compose to start the Kafka and Zookeeper containers in the background.

```bash
docker-compose up -d
```

### 3. Run the Services

Open two separate terminal windows.

In the first terminal, start the consumer:
```bash
npm run consumer
```

In the second terminal, start the producer API:
```bash
npm run producer
```

## Usage

Once both services are running, you can simulate a VTEX order event by sending a `POST` request to the producer's endpoint.

```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
  "orderId": "v123456789-01",
  "status": "handling",
  "totalValue": 250.50
}' \
http://localhost:3000/vtex/order-hook
```

You should see the producer logging the receipt of the event and the consumer logging the processing of the message from the Kafka topic.

## Shutting Down

To stop the services, press `Ctrl+C` in each terminal. To stop and remove the Docker containers, run:

```bash
docker-compose down
```