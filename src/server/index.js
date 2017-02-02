'use strict'

const express = require('express')
const graphqlHTTP = require('express-graphql')
const mqttServer = require('./mqtt')

const app = express()

app.use('/graphql', graphqlHTTP({
  schema: require('./schema'),
  graphiql: true,
  context: {mqttServer}
}))

mqttServer.listen(1885, () => console.log('MQTT is listening on port 1885!'))
app.listen(4000, () => console.log('Express is listening on port 4000!'))
