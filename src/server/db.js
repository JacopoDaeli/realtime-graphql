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
    },
    efgh: {
      id: 'efgh',
      firstname: 'Marco',
      lastname: 'Polo',
      createdAt: now,
      updatedAt: now
    }
  },
  pets: {
    pet1: {
      id: 'pet1',
      name: 'Rocky',
      ownerId: 'abcd',
      createdAt: now,
      updatedAt: now
    },
    pet2: {
      id: 'pet2',
      name: 'Maia',
      ownerId: 'abcd',
      createdAt: now,
      updatedAt: now
    },
    pet3: {
      id: 'pet3',
      name: 'Bob',
      ownerId: 'efgh',
      createdAt: now,
      updatedAt: now
    }
  }
}
