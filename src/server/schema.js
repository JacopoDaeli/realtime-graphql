'use strict'

const sha1 = require('sha1')
const db = require('./db')

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull
} = require('graphql')

const userType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: {type: GraphQLString},
    firstname: {type: GraphQLString},
    lastname: {type: GraphQLString},
    createdAt: {type: GraphQLInt},
    updatedAt: {type: GraphQLInt}
  })
})

module.exports = (mqttServer) => {
  const localSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'QueryType',
      fields: {
        hello: {
          type: GraphQLString,
          resolve (source, args, root, ast) {
            // const fields = ast.selectionSet
            // .selections.map((selection) => selection.name.value)
            return 'world'
          }
        },
        user: {
          type: userType,
          args: {
            id: {type: new GraphQLNonNull(GraphQLString)}
          },
          resolve (source, args, root, ast) {
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
          resolve (source, args, root, ast) {
            const userId = args.id
            const user = db.users[userId]
            if (!user) {
              throw new Error('Not Found')
            }
            user.firstname = args.firstname ? args.firstname : user.firstname
            user.lastname = args.lastname ? args.lastname : user.lastname
            user.updatedAt = Date.now()

            // Notify all the subscribers
            const subs = db.subscriptions.users[userId]
            // console.log(subs)
            if (subs) {
              const subKeys = Object.keys(subs)
              subKeys.forEach((subKey) => {
                const sub = subs[subKey]
                graphql(localSchema, sub.query)
                .then((rql) => {
                  if (rql.data && rql.errors) {
                    return Promise.reject()
                  } else {
                    const message = {
                      topic: sub.topic,
                      qos: 1,
                      payload: JSON.stringify(rql),
                      retain: false
                    }
                    mqttServer.publish(message, () => console.log(sub.topic))
                  }
                })
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
          resolve (source, args, root, ast) {
            const fields = ast.fieldNodes[0]
            .selectionSet.selections.map((sel) => {
              return sel.name.value
            })
            const jFields = fields.join(',')
            const userId = args.id
            const user = db.users[userId]
            if (!user) {
              throw new Error('Not Found')
            }
            let subs = db.subscriptions.users[userId]
            if (!subs) {
              subs = db.subscriptions.users[userId] = {}
            }
            const oQuery = `subscription{subscribeUser(id:"${userId}"){${jFields}}}`
            const oQuerySha1 = sha1(oQuery)
            subs[oQuerySha1] = {
              topic: `/subscriptions/users/${userId}/${oQuerySha1}`,
              query: `query{user(id:"${userId}"){${jFields}}}`
            }
            // console.log(`/subscriptions/users/${userId}/${oQuerySha1}`)
            return user
          }
        }
      }
    })
  })

  return localSchema
}
