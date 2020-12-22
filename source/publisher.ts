import * as Mqtt from 'mqtt';
import { Gpio, BinaryValue } from 'onoff';
import { MqttTopics, LightIntensity, LightSensorStatus } from './types';
import { getMqttUrl } from './helper';

console.log(`Publisher: ${getMqttUrl()}`);

const GPIO_PIN = 23;
const debounceTimeout = 2_000;

let lightSensorStatus: LightSensorStatus = LightSensorStatus.UNKNOWN;

const mqttClient = Mqtt.connect(`${getMqttUrl()}`);

const lightInput = new Gpio(GPIO_PIN, 'in', 'both', {debounceTimeout: debounceTimeout});

function lightChange(err: Error, state: BinaryValue) {
  // TBD error handling
  if (err) throw err;

  const newIntensity = getLightIntensityFromGpio(state);
  console.log(`New intensity: ${newIntensity}`);
  sendLightIntensity(newIntensity);
}

lightInput.watch(lightChange);

mqttClient.on("connect", () => {
  // console.log(packet); // Param: packet: Mqtt.Packet
  mqttClient.subscribe(MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST);
  mqttClient.subscribe(MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST);
  sendLightSensorStatus(lightSensorStatus);
  sendLightIntensity(getLightIntensityFromGpio(lightInput.readSync()));
});

mqttClient.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)

  switch(topic) {
    case MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST:
      sendLightIntensity(getLightIntensityFromGpio(lightInput.readSync()));
      break;
    case MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST:
      sendLightSensorStatus(lightSensorStatus);
      break;
    default:
      break;
  }
});

function getLightIntensityFromGpio(gpioIn: BinaryValue): LightIntensity {
  if(gpioIn) { // sensor pin high --> intensity low --> dark
    return LightIntensity.DARK;
  } else { // sensor pin low --> intensity high --> bright
    return LightIntensity.BRIGHT;
  }
}

function sendLightIntensity(lightIntensity: LightIntensity) {
  console.log(`sendLightIntensity: ${lightIntensity}`);
  mqttClient.publish(MqttTopics.LIGHT_INTENSITY, lightIntensity);
}

function sendLightSensorStatus(lightSensorStatus: LightSensorStatus) {
  console.log(`sendLightSensorStatus: ${lightSensorStatus}`);
  mqttClient.publish(MqttTopics.LIGHT_SENSOR_STATUS, lightSensorStatus);
}