'use strict'

const mosca = require('mosca')
const {graphql} = require('graphql')
const schema = require('./schema')

const mqttServerSettings = {
  port: process.env.MQTT_PORT || 1884
}

const mqttServer = new mosca.Server(mqttServerSettings)

mqttServer.on('published', (packet, client) => {
  if(!packet.topic.includes('$SYS')) {
    const payload = JSON.parse(packet.payload.toString('utf-8'))
    if (packet.topic === '/graphql') {
      const requestId = payload.requestId
      const q = payload.query

      graphql(schema, q, null, {packet,payload,mqttServer})
      .then((rql) => {
        const topic = `/graphql/clients/${client.id}`
        const payload = {requestId, body: rql, status: 200}
        const message = {topic, qos: 1, retain: false}
        if (rql.data && rql.errors) {
          payload.status = 500
        }
        message.payload = JSON.stringify(payload)
        mqttServer.publish(message, () => {
          console.log(`[${client.id}:${requestId}] GraphQL response sent!`)
        })
      })
    }
  }
})

mqttServer.on('ready', () => {
  console.log(`Mosca server is up and running on port ${mqttServerSettings.port}.`)
})
