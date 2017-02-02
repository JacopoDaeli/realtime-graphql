'use strict'

const db = require('./db')

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull
} = require('graphql')

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

          mqttServer.publish(`subscribeUserUpdate_${userId}`, user)
          .catch((err) => console.error(err))

          return user
        }
      }
    }
  }),
  subscription: new GraphQLObjectType({
    name: 'SubscriptionType',
    fields: {
      subscribeUserUpdate: {
        type: userType,
        args: {
          id: {type: new GraphQLNonNull(GraphQLString)}
        },
        resolve (user) {
          return user // user
        }
      }
    }
  })
})

module.exports = schema
