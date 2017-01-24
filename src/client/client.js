'use strict'

const mqtt = require('mqtt')
const sha1 = require('sha1')

const client  = mqtt.connect(`mqtt://localhost:${process.env.MQTT_PORT || 1884}`)

let ref = 0

client.on('connect', () => {
  // Subscribe to recevive graphql responses
  client.subscribe(`/clients/${client.options.clientId}/graphql`)

  // Run some GraphQL queries
  client.publish('graphql', JSON.stringify({
    ref: ref++,
    query: 'query{hello}'
  }))

  client.publish('graphql', JSON.stringify({
    ref: ref++,
    query: 'query{user(id:"abcd"){id,firstname}}'
  }))

  const sQuery1 = 'subscription{subscribeUser(id:"abcd"){firstname}}'
  client.publish('graphql', JSON.stringify({
    ref: ref++,
    query: sQuery1
  }), () => {
    client.subscribe(`/subscriptions/users/abcd/${sha1(sQuery1)}`)
    // console.log(`Subscribed to /subscriptions/users/abcd/${sha1(sQuery1)}`)
  })

  const sQuery2 = 'subscription{subscribeUser(id:"abcd"){id,lastname}}'
  client.publish('graphql', JSON.stringify({
    ref: ref++,
    query: sQuery2
  }), () => {
    client.subscribe(`/subscriptions/users/abcd/${sha1(sQuery2)}`)
    // console.log(`Subscribed to /subscriptions/users/abcd/${sha1(sQuery1)}`)
  })

  setTimeout(() => {
    client.publish('graphql', JSON.stringify({
      ref: ref++,
      query: 'mutation{updateUser(id:"abcd",firstname:"opocaJ"){id, firstname}}'
    }))
  }, 1000)

})

client.on('message', (topic, message) => {
  if (topic === `/clients/${client.options.clientId}/graphql`) {
    // HERE GRAPHQL RESPONSES
    const response = JSON.parse(message.toString())
    console.log(`[${response.ref}]: ${JSON.stringify(response.body)}`)
  } else {
    // HERE SUBSCRTION UPDATES
    console.log(message.toString())
  }
})
