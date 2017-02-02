'use strict'

const net = require('net')
const mqttCon = require('mqtt-connection')
const {graphql} = require('graphql')
const schema = require('./schema')

let clients = {}
let subscriptions = {}

net.Server.prototype.publish = (topic, rootValue) => {
  if (!subscriptions[topic]) return Promise.reject()

  return Promise.all(subscriptions[topic].map((sub) => {
    const clientId = sub.clientId

    return graphql(schema, sub.graphqlSub, rootValue, {mqttServer: this})
    .then((rql) => {
      return new Promise((resolve, reject) => {
        clients[clientId].stream.publish({
          topic: topic,
          qos: sub.qos,
          messageId: Date.now(),
          payload: JSON.stringify(rql)
        }, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  }))
}

const server = new net.Server()

server.on('connection', (stream) => {
  const client = mqttCon(stream)

  // client connected
  client.on('connect', (packet) => {
    client.id = packet.clientId
    clients[packet.clientId] = {stream: client, topics: []}

    // acknowledge the connect packet
    client.connack({returnCode: 0})
  })

  // client published
  client.on('publish', (packet) => {
    // send a puback with messageId (for QoS > 0)
    if (packet.qos > 0) {
      client.puback({messageId: packet.messageId})
    }
  })

  // client pinged
  client.on('pingreq', () => {
    console.log(`${client.id} --> pingreq`)
    client.pingresp()
  })

  // client subscribed
  client.on('subscribe', (packet) => {
    packet.subscriptions.map((sub) => {
      const parsedTopic = sub.topic.split('__')
      const topic = parsedTopic[0]
      const graphqlSub = parsedTopic[1]
      const qos = sub.qos

      if (!subscriptions[topic]) {
        subscriptions[topic] = []
      }

      clients[client.id].topics.push(topic)

      subscriptions[topic].push({
        clientId: client.id,
        graphqlSub: graphqlSub,
        qos: qos
      })
    })

    // send a suback with messageId and granted QoS level
    client.suback({
      granted: [packet.qos],
      messageId: packet.messageId
    })
  })

  // timeout idle streams after 5 minutes
  stream.setTimeout(1000 * 60 * 5)

  function cleanClient () {
    const topics = clients[client.id].topics
    topics.forEach((topic) => {
      const subTopic = []
      subscriptions[topic].forEach((sub) => {
        if (sub.clientId !== client.id) {
          subTopic.push(sub)
        }
      })
      if (subTopic.length === 0) {
        delete subscriptions[topic]
      } else {
        subscriptions[topic] = subTopic
      }
    })
    delete clients[client.id]
    client.destroy()
  }

  // connection error handling
  client.on('close', cleanClient)
  client.on('error', cleanClient)
  client.on('disconnect', cleanClient)

  // stream timeout
  stream.on('timeout', cleanClient)
})

module.exports = server
