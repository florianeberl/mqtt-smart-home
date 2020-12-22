# Simple MQTT PoC

## Prerequisites
* Raspberry PI with Brightness Sensor

## How to get started
1. `npm i`
2. `npm run compile`

## How to run the project
The project consists of 3 different parts
1. MQTT Broker: `npm run mqtt:broker`
   The broker is used to transmit messages by topic between the clients
2. Publisher: `npm run mqtt:publisher`
   Transmits brightness data to all subscribers
3. Subscribers: `npm run mqtt:subscriber:sms` or `npm run mqtt:subscriber:console`
   Receive brightness data and alert the customer if necessary. Twilio is used to transmit SMS