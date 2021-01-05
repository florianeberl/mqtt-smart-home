import * as Mqtt from 'mqtt';
import { Gpio, BinaryValue } from 'onoff';
import { MqttTopics, LightIntensity, LightSensorStatus } from './types';
import { getMqttUrl } from './helper';

console.log(`Publisher: ${getMqttUrl()}`);

let lightIntensity: LightIntensity = LightIntensity.UNKNOWN;

const GPIO_PIN = 23;
const debounceTimeout = 10_000;

// https://www.linux-magazin.de/ausgaben/2015/11/mqtt/2/
const mqttClient = Mqtt.connect(`${getMqttUrl()}`, {
  will: {
    topic: MqttTopics.LIGHT_SENSOR_STATUS,
    payload: LightSensorStatus.NOT_AVAILABLE,
    retain: true, // broker transmits last known status even if publisher is disconnected
    qos: 1, // at least once delivered
  }
});

const lightInput = new Gpio(GPIO_PIN, 'in', 'both', {debounceTimeout: debounceTimeout});

function lightChange(err: Error, state: BinaryValue) {
  // TBD error handling
  if (err) throw err;

  const newIntensity = getLightIntensityFromGpio(state);
  if(newIntensity !== lightIntensity) {
    console.log(`New intensity: ${newIntensity}`);
    // Debouncing still sends the message, but hides the toggling
    lightIntensity = newIntensity;
    sendLightIntensity(lightIntensity);
  }
}

lightInput.watch(lightChange);

mqttClient.on("connect", () => {
  // console.log(packet); // Param: packet: Mqtt.Packet
  mqttClient.subscribe(MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST);
  mqttClient.subscribe(MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST);
  sendLightSensorStatus(LightSensorStatus.AVAILABLE);
  sendLightIntensity(getLightIntensityFromGpio(lightInput.readSync()));
});

mqttClient.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)

  switch(topic) {
    case MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST:
      sendLightIntensity(getLightIntensityFromGpio(lightInput.readSync()));
      break;
    case MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST:
      sendLightSensorStatus(LightSensorStatus.AVAILABLE);
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