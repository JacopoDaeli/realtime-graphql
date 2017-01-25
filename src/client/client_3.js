'use strict'

const mqtt = require('mqtt')
const sha1 = require('sha1')

const client  = mqtt.connect(`mqtt://localhost:${process.env.MQTT_PORT || 1884}`)

let graphqlWire = undefined

client.on('connect', () => {
  if (!graphqlWire) {
    graphqlWire = require('./graphql-wire')(client)
  }

  const mut = '{updateUser(id:"abcd",firstname:"opocaJ"){id,firstname}}'
  graphqlWire.mutate(mut, (err, res) => {
    if (err) console.log(err)
    else console.log(`[${res.requestId}]: ${JSON.stringify(res.body)}`)
  })
})
