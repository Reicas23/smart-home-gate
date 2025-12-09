const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("Conectado, enviando pruebas...");

  // Simular sensores
  client.publish("casa/pir", "1");
  client.publish("casa/distancia", "12");
  client.publish("casa/ldr", "80");
  client.publish("casa/alerta", "objeto_cercano");
  client.publish("casa/estado_porton", "abierto");

  // ⚠ CAMBIADO: topic correcto según tu Arduino y servidor
  client.publish("casa/estado_luces", "ON");

  console.log("Mensajes enviados.");
  setTimeout(() => process.exit(), 500);
});
