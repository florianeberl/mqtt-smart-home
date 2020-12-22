import * as Mqtt from 'mqtt';
import { Gpio } from 'onoff';
import { MqttTopics, LightIntensity, LightSensorStatus } from './types';
import { getMqttUrl } from './helper';

console.log(`Publisher: ${getMqttUrl()}`);

const GPIO_PIN = 23;

let lightIntensity: LightIntensity = LightIntensity.UNKNOWN;
let lightSensorStatus: LightSensorStatus = LightSensorStatus.UNKNOWN;

const mqttClient = Mqtt.connect(`${getMqttUrl()}`);

const lightInput = new Gpio(GPIO_PIN, 'in', 'both');

function lightChange(err: Error, state: unknown) {
  console.log(`Error: ${err}`);
  console.log(`State: ${state}`);
}

lightInput.watch(lightChange);

// TODO 
// lightInput.readSync();

mqttClient.on("connect", () => {
  // console.log(packet); // Param: packet: Mqtt.Packet
  mqttClient.subscribe(MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST);
  mqttClient.subscribe(MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST);
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

function getLightIntensityFromGpio(gpioIn: boolean): LightIntensity {
  if(gpioIn) { // sensor pin high --> intensity low --> dark
    return LightIntensity.DARK;
  } else { // sensor pin low --> intensity high --> bright
    return LightIntensity.BRIGHT;
  }
}

function sendLightIntensity(lightIntensity: LightIntensity) {
  mqttClient.publish(MqttTopics.LIGHT_INTENSITY, lightIntensity);
}

function sendLightSensorStatus(lightSensorStatus: LightSensorStatus) {
  mqttClient.publish(MqttTopics.LIGHT_SENSOR_STATUS, lightSensorStatus);
}