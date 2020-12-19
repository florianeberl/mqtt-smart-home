import * as Mqtt from 'mqtt';
import { MqttTopics, LightIntensity, LightSensorStatus } from './types';
import { getMqttUrl } from './helper';

console.log(`Publisher: ${getMqttUrl()}`);

const readoutIntervalMs = 2_000;
const debounceTimeMs = 1_000;

let lightIntensity: LightIntensity = LightIntensity.UNKNOWN;
let lightSensorStatus: LightSensorStatus = LightSensorStatus.UNKNOWN;

const mqttClient = Mqtt.connect(`${getMqttUrl()}`);

mqttClient.on("connect", async () => {
  // console.log(packet); // Param: packet: Mqtt.Packet
  mqttClient.subscribe(MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST);
  mqttClient.subscribe(MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST);
  sendLightSensorStatus(lightSensorStatus);
  // TODO connect GPIO PIN
  lightSensorStatus = LightSensorStatus.AVAILABLE;
  sendLightSensorStatus(lightSensorStatus);
});

mqttClient.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)

  switch(topic) {
    case MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST:
      sendLightIntensity(lightIntensity);
      break;
    case MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST:
      sendLightSensorStatus(lightSensorStatus);
      break;
    default:
      break;
  }
});

setInterval(readLightStatus, readoutIntervalMs);

function getGpioInput(): LightIntensity {
  // TBD: what does High / Low aka true / false really mean?
  const gpioRawValue: boolean = (Math.random() < 0.5) ? false : true;
  return (gpioRawValue) ? LightIntensity.BRIGHT : LightIntensity.DARK;
}

async function readLightStatus(): Promise<void> {
  
  let changed: boolean = false;
  let newLightIntensity: LightIntensity = getGpioInput();
  if (newLightIntensity !== lightIntensity) {
    await new Promise(resolve => setTimeout(resolve, debounceTimeMs));
    newLightIntensity = getGpioInput();
    if(newLightIntensity !== lightIntensity) {
      changed = true;
    }
  }
  lightIntensity = newLightIntensity;
  console.log(`Light Status: ${lightIntensity}`);
  if(changed) {
    console.log(`Light Status: ${lightIntensity} --> CHANGE DETECTED`);
    sendLightIntensity(lightIntensity);
  }
}

function sendLightIntensity(lightIntensity: LightIntensity) {
  mqttClient.publish(MqttTopics.LIGHT_INTENSITY, lightIntensity);
}

function sendLightSensorStatus(lightSensorStatus: LightSensorStatus) {
  mqttClient.publish(MqttTopics.LIGHT_SENSOR_STATUS, lightSensorStatus);
}