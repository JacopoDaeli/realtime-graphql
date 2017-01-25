'use strict'

const mqtt = require('mqtt')
const sha1 = require('sha1')

const mqttUrl = `mqtt://localhost:${process.env.MQTT_PORT || 1884}`
const client  = mqtt.connect(mqttUrl, {
  reconnectPeriod: 0
})

client.on('connect', () => {
  const graphqlWire = require('./graphql-wire')(client)

  // TEST
  graphqlWire.query('{hello}', (err, res) => {
    if (err) console.log(err)
    else console.log(`[${res.requestId}]: ${JSON.stringify(res.body)}`)
  })

  // Q1
  const q1 = '{user(id:"abcd"){id,firstname,pets{id,name,owner{firstname,lastname}}}}'
  graphqlWire.query(q1, (err, res) => {
    if (err) console.log(err)
    else console.log(`[${res.requestId}]: ${JSON.stringify(res.body)}`)
  })

  // SQ1
  const sq1 = '{subscribeUser(id:"abcd"){id,firstname,pets{id,name,owner{firstname,lastname}}}}'
  const sq1Hash = sha1(sq1).substring(0, 5)
  graphqlWire.subscribe(sq1, (err, res) => { // cb
    if (err) console.log(err)
    else console.log(`[${res.requestId}]: Subscribed to ${sq1} (${sq1Hash})`)
  }, (data) => { // onUpdate
    console.log(`[SUB:${sq1Hash}]: ${JSON.stringify(data)}`)
  })
})
