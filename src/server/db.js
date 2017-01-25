'use strict'

const now = `${Date.now()}`

module.exports = {
  users: {
    abcd: {
      id: 'abcd',
      firstname: 'Jacopo',
      lastname: 'Daeli',
      createdAt: now,
      updatedAt: now
    }
  },
  subscriptions: {
    users: {
      // id: {query: ""}
    }
  }
}
