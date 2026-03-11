import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Kafka, Producer } from "kafkajs";

// --- Configuration ---
// For production, use environment variables
const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ["localhost:9094", "localhost:9095", "localhost:9096"];
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "payment-service";
const KAFKA_TOPIC_PAYMENT = process.env.KAFKA_TOPIC_PAYMENT || "payment-successful";
const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// --- Interfaces ---
interface HttpError extends Error {
  status?: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface PaymentRequestBody {
  cart: CartItem[];
}

// --- Kafka Setup ---
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
});

const producer: Producer = kafka.producer();

// --- Express App ---
const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// --- Routes ---
app.post(
  "/payment-service",
  async (req: Request<{}, {}, PaymentRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { cart } = req.body;
      // In a real-world scenario, user ID would come from an authenticated session/token
      const userId = "123";

      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: "Invalid or empty cart provided." });
      }

      console.log(`Processing payment for user ${userId}...`);
      // TODO: Implement actual payment gateway logic here.
      // This should be an atomic operation. If payment fails, do not send Kafka message.

      await producer.send({
        topic: KAFKA_TOPIC_PAYMENT,
        messages: [{ value: JSON.stringify({ userId, cart }) }],
      });
      console.log(`Payment event for user ${userId} published to topic "${KAFKA_TOPIC_PAYMENT}".`);

      // Respond to the client immediately. Downstream services will handle the event.
      return res.status(202).json({ message: "Payment processing initiated." });
    } catch (error) {
      // Pass error to the centralized error handler
      next(error);
    }
  }
);

// --- Error Handling Middleware ---
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  console.error("An error occurred:", err.stack);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// --- Server Startup and Shutdown ---
const startServer = async () => {
  try {
    // 1. Connect to Kafka
    await producer.connect();
    console.log("Kafka Producer connected successfully.");

    // 2. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Payment service is running on port ${PORT}`);
    });

    // 3. Graceful shutdown logic
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("HTTP server closed.");
        await producer.disconnect();
        console.log("Kafka Producer disconnected.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();