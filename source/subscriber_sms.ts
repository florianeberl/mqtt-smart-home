import * as Mqtt from 'mqtt';
import { MqttTopics, LightIntensity } from './types';
import { getMqttUrl } from './helper';
import * as Twilio from 'twilio';

import * as Dotenv from "dotenv";
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
Dotenv.config();

console.log(`Subscriber: ${getMqttUrl()}`);

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioSourceNumber = process.env.TWILIO_SOURCE_NUMBER;
const twilioTargetNumber = "+491777837762";

const twilioClient: Twilio.Twilio = Twilio(twilioAccountSid, twilioAuthToken);

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
      sendSms(lightIntensity);
    }
  }
});

function sendSms(lightIntensity: LightIntensity) {
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
  console.log(`Send SMS: ${messageText}`);
  twilioClient.messages
  .create({
     body: messageText,
     from: twilioSourceNumber,
     to: twilioTargetNumber,
   })
  .then((message: MessageInstance) => console.log(message.sid))
  .catch((err: Error) => console.error(err));
}