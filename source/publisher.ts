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
  sendLightSensorStatus();
  // TODO connect GPIO PIN
  lightSensorStatus = LightSensorStatus.AVAILABLE;
  sendLightSensorStatus();
});

mqttClient.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)

  switch(topic) {
    case MqttTopics.LIGHT_INTENSITY_UPDATE_REQUEST:
      sendLightIntensity();
      break;
    case MqttTopics.LIGHT_SENSOR_STATUS_UPDATE_REQUEST:
      sendLightSensorStatus();
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
    sendLightIntensity();
  }
}

function sendLightIntensity() {
  mqttClient.publish(MqttTopics.LIGHT_INTENSITY, lightIntensity);
}

function sendLightSensorStatus() {
  mqttClient.publish(MqttTopics.LIGHT_SENSOR_STATUS, lightSensorStatus);
}

/**
 * Want to notify controller that sensor is disconnected before shutting down
 */
function handleAppExit (options: {exit?: boolean}|null, err?:Error) {
  lightSensorStatus = LightSensorStatus.NOT_AVAILABLE;
  sendLightSensorStatus();
  if (err) {
    console.log(err.stack)
  }

  if (options.exit) {
    process.exit()
  }
}

/**
 * Handle the different ways an application can shutdown
 */
process.on('exit', handleAppExit.bind(null, {
  exit: true
}))
process.on('SIGINT', handleAppExit.bind(null, {
  exit: true
}))
process.on('unhandledRejection', (err: Error) => {
  handleAppExit.bind(null, {exit: true}, err);
});
process.on('uncaughtException', (err: Error) => {
  handleAppExit.bind(null, {exit: true}, err);
});