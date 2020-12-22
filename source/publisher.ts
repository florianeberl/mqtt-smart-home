import * as Mqtt from 'mqtt';
import * as Gpio from 'rpi-gpio';
import { MqttTopics, LightIntensity, LightSensorStatus } from './types';
import { getMqttUrl } from './helper';

console.log(`Publisher: ${getMqttUrl()}`);

const GPIO_PIN = 23;

let lightIntensity: LightIntensity = LightIntensity.UNKNOWN;
let lightSensorStatus: LightSensorStatus = LightSensorStatus.UNKNOWN;

const mqttClient = Mqtt.connect(`${getMqttUrl()}`);

Gpio.setMode("mode_rpi");

Gpio.on('change', (channel: number, value: boolean) => {
  if (channel === GPIO_PIN) {
    const intensity: LightIntensity = getLightIntensityFromGpio(value);
    console.log(`Channel: ${channel} | LightIntensity: ${intensity}`);
    if(lightIntensity !== intensity) {
      console.log('Value really changed'); // TODO: trigger debounce timeout and read again
    }
  } else {
    console.log(`Unknown channel: ${channel}`);
  }
});

Gpio.setup(GPIO_PIN, Gpio.DIR_IN, Gpio.EDGE_BOTH, (err?: Error, val?: boolean) => {
  console.log(`Error: ${err}`);
  console.log(`Value: ${val}`);
  if(!err) {
    lightSensorStatus = LightSensorStatus.AVAILABLE;
  } else {
    lightSensorStatus = LightSensorStatus.NOT_AVAILABLE;
  }
});


setInterval(() => {
  Gpio.read(GPIO_PIN, (err?: Error, val?: boolean) => {
    console.log('READ');
    console.log(`Error: ${err}`);
    console.log(`Value: ${val}`);
  })
}, 2_000);

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