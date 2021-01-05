import * as Mqtt from 'mqtt';
import { getMqttUrl } from './helper';

const mqttClient = Mqtt.connect(`${getMqttUrl()}`);

mqttClient.on('connect', () => {
  mqttClient.subscribe('#'); // subscribe all topics
});

mqttClient.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)
});