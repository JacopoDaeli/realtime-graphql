'use strict'

const mosca = require('mosca')
const {graphql} = require('graphql')

const mqttServerSettings = {
  port: process.env.MQTT_PORT || 1884
}

const mqttServer = new mosca.Server(mqttServerSettings)
const schema = require('./schema')(mqttServer)

mqttServer.on('published', (packet, client) => {
  if(!packet.topic.includes('$SYS')) {
    const payload = JSON.parse(packet.payload.toString('utf-8'))
    if (packet.topic === 'graphql') {
      const ref = payload.ref
      const q = payload.query

      graphql(schema, q)
      .then((rql) => {
        const payload = {
          ref: ref,
          body: rql,
          status: 200
        }
        const message = {
          topic: `/clients/${client.id}/graphql`,
          qos: 1,
          retain: false
        }
        if (rql.data && rql.errors) {
          payload.status = 500
        }
        message.payload = JSON.stringify(payload)
        mqttServer.publish(message, () => {
          console.log(`[${client.id}:${ref}] GraphQL response sent!`)
        })
      })
    }
  }
})

mqttServer.on('ready', () => {
  console.log(`Mosca server is up and running on port ${mqttServerSettings.port}.`)
})

// let message = {
//   topic: 'presence',
//   payload: 'abcde', // or a Buffer
//   qos: 0, // 0, 1, or 2
//   retain: false // or true
// }

// setInterval(() => server.publish(message, () => console.log('done!')), 1000)
