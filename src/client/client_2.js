'use strict'

const mqtt = require('mqtt')
const sha1 = require('sha1')

const client  = mqtt.connect(`mqtt://localhost:${process.env.MQTT_PORT || 1884}`)

let graphqlWire = undefined

client.on('connect', () => {
  if (!graphqlWire) {
    graphqlWire = require('./graphql-wire')(client)
  }

  const subQuery = '{subscribeUser(id:"abcd"){id,firstname,updatedAt}}'
  const subQueryHash = sha1(subQuery).substring(0, 5)
  graphqlWire.subscribe(subQuery, (err, res) => { // cb
    if (err) console.log(err)
    else console.log(`[${res.requestId}]: Subscribed to ${subQuery} (${subQueryHash})`)
  }, (data) => { // onUpdate
    console.log(`[SUB:${subQueryHash}]: ${JSON.stringify(data)}`)
  })
})
