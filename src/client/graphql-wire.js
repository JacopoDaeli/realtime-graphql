'use strict'

const shortid = require('shortid')
const sha1 = require('sha1')

module.exports = (mqttClient) => {
  const mqttClientId = mqttClient.options.clientId
  const requests = {}
  const subscriptions = {}

  mqttClient.subscribe(`/graphql/clients/${mqttClientId}`)

  // Run some GraphQL queries
  mqttClient.on('message', (topic, message) => {
    if (topic === `/graphql/clients/${mqttClientId}`) {
      const res = JSON.parse(message.toString())
      const requestId = res.requestId
      requests[requestId](null, res)
      requests[requestId] = undefined
    } else if (topic.includes('/graphql/subscriptions/')) {
      const subHash = topic.replace('/graphql/subscriptions/', '')
      subscriptions[subHash](JSON.parse(message.toString()))
    }
  })

  function send (query, cb) {
    const requestId = shortid.generate()
    mqttClient.publish('/graphql', JSON.stringify({
      requestId,
      query
    }), (err) => {
      if (err) {
        cb(err)
      } else {
        requests[requestId] = cb
      }
    })
    return requestId
  }

  return {
    query (q, cb) {
      return send(`query${q}`, cb)
    },
    mutate (m, cb) {
      return send(`mutation${m}`, cb)
    },
    subscribe (s, cb, onUpdate) {
      const sub = `subscription${s}`
      return send(sub, (err, res) => {
        if (!err) {
          const subHash = sha1(sub)
          subscriptions[subHash] = onUpdate
          mqttClient.subscribe(`/graphql/subscriptions/${subHash}`)
        }
        cb(err, res)
      })
    }

    // UNSUBSCRIBE
    // Maybe a mutation to unsubscribe?
  }
}
