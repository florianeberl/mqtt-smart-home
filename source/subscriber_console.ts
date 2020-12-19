import * as Mqtt from 'mqtt';
import { MqttTopics, LightIntensity } from './types';
import { getMqttUrl } from './helper';

console.log(`Subscriber: ${getMqttUrl()}`);

const mqttClient = Mqtt.connect(`${getMqttUrl()}`);

let lightIntensity: LightIntensity = LightIntensity.UNKNOWN;

mqttClient.on('connect', () => {
  mqttClient.subscribe(MqttTopics.LIGHT_INTENSITY);
  mqttClient.subscribe(MqttTopics.LIGHT_SENSOR_STATUS);
})

mqttClient.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)

  if(topic === MqttTopics.LIGHT_INTENSITY) {
    const newLightIntensity = <LightIntensity>message.toString();
    console.log(`newLightIntensity: ${newLightIntensity} | lightIntensity: ${lightIntensity} | ${(newLightIntensity != lightIntensity)}`);
    if(newLightIntensity != lightIntensity) {
      lightIntensity = newLightIntensity;
      printData(lightIntensity);
    }
  }
});

function printData(lightIntensity: LightIntensity) {
  let messageText: string;
  switch(lightIntensity) {
    case LightIntensity.DARK:
      messageText = "Alert: your room is darker than expected!";
      break;
    case LightIntensity.BRIGHT:
      messageText = "Your room is back to normal";
      break;
    default:
      messageText = "Unknown light intensity for your room";
      break;
  }
  console.log(`Light intensity update: ${messageText}`);
}

// TBD: we could regularly pull a status
/*
setInterval(() => {
  client.publish(MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST, "");
}, 60_000)

setInterval(() => {
  client.publish(MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST, "");
}, 20_000);
*/