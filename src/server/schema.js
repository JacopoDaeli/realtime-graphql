'use strict'

const sha1 = require('sha1')
const db = require('./db')

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull
} = require('graphql')

function buildMQTTMessage (topic, payload) {
  return {
    topic,
    qos: 1,
    payload,
    retain: false
  }
}

const petType = new GraphQLObjectType({
  name: 'PetType',
  fields: () => ({
    id: {type: GraphQLString},
    name: {type: GraphQLString},
    owner: {
      type: userType,
      resolve (parent, args, context, ast) {
        const pet = parent
        let owner = null
        Object.keys(db.users).some((userId) => {
          if (db.users[userId].id === pet.ownerId) {
            owner = db.users[userId]
          }
        })
        return owner
      }
    },
    createdAt: {type: GraphQLString},
    updatedAt: {type: GraphQLString}
  })
})

const userType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: {type: GraphQLString},
    firstname: {type: GraphQLString},
    lastname: {type: GraphQLString},
    pets: {
      type: new GraphQLList(petType),
      resolve (parent, args, context, ast) {
        const user = parent
        const pets = []
        Object.keys(db.pets).forEach((petId) => {
          if (db.pets[petId].ownerId === user.id) {
            pets.push(db.pets[petId])
          }
        })
        return pets
      }
    },
    createdAt: {type: GraphQLString},
    updatedAt: {type: GraphQLString}
  })
})

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'QueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve (parent, args, context, ast) {
          return 'world'
        }
      },
      user: {
        type: userType,
        args: {
          id: {type: new GraphQLNonNull(GraphQLString)}
        },
        resolve (parent, args, context, ast) {
          // If parent exists, skip the fetch
          if (parent) return parent
          const userId = args.id
          const user = db.users[userId]
          if (!user) throw new Error('Not Found')
          else return user
        }
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'MutationType',
    fields: {
      updateUser: {
        type: userType,
        args: {
          id: {type: new GraphQLNonNull(GraphQLString)},
          firstname: {type: GraphQLString},
          lastname: {type: GraphQLString}
        },
        resolve (_, args, context, ast) {
          const mqttServer = context.mqttServer
          const userId = args.id
          const user = db.users[userId]
          if (!user) {
            throw new Error('Not Found')
          }

          // SAVE IN THE DATABASE
          user.firstname = args.firstname ? args.firstname : user.firstname
          user.lastname = args.lastname ? args.lastname : user.lastname
          user.updatedAt = `${Date.now()}`

          // PUBLISH UPDATE TO SUBSCRIBERS
          const subs = db.subscriptions.users[userId]
          if (subs) {
            const subKeys = Object.keys(subs)
            subKeys.forEach((subKey) => {
              const sub = subs[subKey]
              graphql(schema, sub.query, user, context)
              .then((rql) => {
                if (rql.errors) {
                  return Promise.reject(rql.errors)
                }
                return rql
              })
              .then((rql) => {
                const message = buildMQTTMessage(sub.topic, JSON.stringify(rql))
                mqttServer.publish(message, () => {
                  console.log('Pushed: ' + sub.topic)
                })
              })
              .catch((err) => console.error(err))
            })
          }

          return user
        }
      }
    }
  }),
  subscription: new GraphQLObjectType({
    name: 'SubscriptionType',
    fields: {
      subscribeUser: {
        type: userType,
        args: {
          id: {type: new GraphQLNonNull(GraphQLString)}
        },
        resolve (_, args, context, ast) {
          const oQuery = context.payload.query
          const userId = args.id
          const user = db.users[userId]
          if (!user) {
            throw new Error('Not Found')
          }
          let subs = db.subscriptions.users[userId]
          if (!subs) {
            subs = db.subscriptions.users[userId] = {}
          }
          const oQuerySha1 = sha1(oQuery)
          subs[oQuerySha1] = {
            topic: `/graphql/subscriptions/${oQuerySha1}`,
            query: oQuery.replace('subscription{subscribeUser', 'query{user')
          }
          return user
        }
      }
    }
  })
})

module.exports = schema
