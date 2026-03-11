const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: 'vtex-producer-app',
  brokers: ['localhost:9092'] // Endereço do seu broker Kafka
});

const producer = kafka.producer();
const topic = 'vtex-orders';

app.post('/vtex/order-hook', async (req, res) => {
  const orderPayload = req.body;

  if (!orderPayload || !orderPayload.orderId) {
    console.log('Payload inválido recebido.');
    return res.status(400).json({ message: 'Payload inválido. orderId é obrigatório.' });
  }

  console.log(`Recebido evento para o pedido: ${orderPayload.orderId}`);

  try {
    await producer.send({
      topic: topic,
      messages: [
        { key: orderPayload.orderId, value: JSON.stringify(orderPayload) },
      ],
    });

    console.log(`Mensagem para o pedido ${orderPayload.orderId} enviada para o tópico "${topic}"`);
    res.status(200).json({ message: 'Evento recebido e publicado no Kafka com sucesso!' });

  } catch (error) {
    console.error('Erro ao publicar mensagem no Kafka:', error);
    res.status(500).json({ message: 'Erro interno ao processar o evento.' });
  }
});

const run = async () => {
  await producer.connect();
  console.log('Producer conectado ao Kafka.');

  const port = 3000;
  app.listen(port, () => {
    console.log(`Producer API rodando na porta ${port}. Aguardando eventos...`);
  });
};

run().catch(console.error);
