'use strict'

const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://localhost:1885')

const sub1 = 'subscription{subscribeUserUpdate(id:"abcd"){id,firstname,pets{name}}}'
const topic1 = `subscribeUserUpdate_abcd`

const sub2 = 'subscription{subscribeUserUpdate(id:"efgh"){id,firstname,lastname}}'
const topic2 = `subscribeUserUpdate_efgh`

client.on('message', (topic, message) => {
  console.log(message.toString())
})

client.on('connect', (connack) => {
  console.log('connect')
})

client.subscribe(`${topic1}__${sub1}`, (err, granted) => {
  if (err) console.error('Error subscribing...')
})

client.subscribe(`${topic2}__${sub2}`, (err, granted) => {
  if (err) console.error('Error subscribing...')
})
