'use strict'

const mqtt = require('mqtt')
const sha1 = require('sha1')

const mqttUrl = `mqtt://localhost:${process.env.MQTT_PORT || 1884}`
const client  = mqtt.connect(mqttUrl, {
  reconnectPeriod: 0
})

client.on('connect', () => {
  const graphqlWire = require('./graphql-wire')(client)

  const mut = '{updateUser(id:"abcd",firstname:"opocaJ"){id,firstname}}'
  graphqlWire.mutate(mut, (err, res) => {
    if (err) console.log(err)
    else console.log(`[${res.requestId}]: ${JSON.stringify(res.body)}`)
  })
})
