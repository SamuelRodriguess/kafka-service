const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "vtex-consumer-app",
  brokers: ["localhost:9092"], // Endereço do seu broker Kafka
});

const consumer = kafka.consumer({ groupId: "vtex-order-processor-group" });
const topic = "vtex-orders";

const run = async () => {
  await consumer.connect();
  console.log("Consumer conectado ao Kafka.");

  await consumer.subscribe({ topic: topic, fromBeginning: true });
  console.log(`Inscrito no tópico "${topic}". Aguardando mensagens...`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const messageResult = message.value.toString();
      const orderPayload = JSON.parse(messageResult);

      console.log("----------------------------------------------------");
      console.log(`Nova mensagem recebida do tópico "${topic}"`);
      console.log(`Partição: ${partition}`);
      console.log(`Pedido ID: ${orderPayload.orderId}`);
      console.log("Payload:", orderPayload);

      // AQUI VOCÊ COLOCA A LÓGICA DE NEGÓCIO
      // Ex: Salvar no banco de dados, chamar um ERP, etc.
      // simula um processamento
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`Pedido ${orderPayload.orderId} processado com sucesso.`);
    },
  });
};

run().catch((e) => console.error(`[vtex-consumer] ${e.message}`, e));

process.on("SIGINT", async () => {
  console.log("Desconectando consumer...");
  await consumer.disconnect();
});
