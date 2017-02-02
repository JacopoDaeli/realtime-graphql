# realtime-graphql
A proposition for real-time applications with GraphQL, Node.js and MQTT.

### Demo
In this demo, we have three clients both subscribing to `subscribeUserUpdate` graphql subscription to receive the updated data when User(id: "<id>") is modified by the GraphQL mutation `updateUser`.

Client1 subscribes with the following graphql subscription:
```
subscription {
  subscribeUserUpdate(id: "abcd") {
    id
    firstname
    lastname
  }
}
```

Client2 subscribes with the following graphql subscriptions:
```
# SUB 1
subscription {
  subscribeUserUpdate(id: "abcd") {
    id
    firstname
    pets {
      name
    }
  }
}

# SUB 2
subscription {
  subscribeUserUpdate(id: "efgh") {
    id
    firstname
    lastname
  }
}
```

Run `npm run start-server`, `npm run start-client1` and `npm run start-client2`.
Run each command in separate terminal session.

Open your browser and visit `http://localhost:4000/graphql`.

Using GraphiQL run:
```
query userQuery {
  user(id: "abcd") {
    id
    firstname
    lastname
    pets {
      name
    }
  }
}
```

It should return:
```
{
  "data": {
    "user": {
      "id": "abcd",
      "firstname": "Jacopo",
      "lastname": "Daeli",
      "pets": [
        {
          "name": "Rocky"
        },
        {
          "name": "Maia"
        }
      ]
    }
  }
}
```

Again, using GraphiQL run:
```
mutation updateUserMutation {
  updateUser(id:"abcd", firstname: "opocaJ") {
    firstname
  }
}
```

It should return:
```
{
  "data": {
    "updateUser": {
      "firstname": "opocaJ"
    }
  }
}
```

Now, check your terminal. As you can see both clients received the update in the format specified in the format they specified in the GraphQL subscription they subscribed with.

More specifically, Client1 received:
```
{  
   "data":{  
      "subscribeUserUpdate":{  
         "id":"abcd",
         "firstname":"opocaJ",
         "lastname":"Daeli"
      }
   }
}
```

Client2 received:
```
{  
   "data":{  
      "subscribeUserUpdate":{  
         "id":"abcd",
         "firstname":"opocaJ",
         "pets":[  
            {  
               "name":"Rocky"
            },
            {  
               "name":"Maia"
            }
         ]
      }
   }
}
```

Go back to your browser and using GraphiQL run:
```
mutation updateUserMutation {
  updateUser(id:"efgh", firstname: "MARCO") {
    firstname
    lastname
  }
}
```

Again, check your terminal. This time only Client2 received the update because it's the only one that subscribed for receiving new data when user "efgh" is updated.

Client2 received:
```
{  
   "data":{  
      "subscribeUserUpdate":{  
         "id":"efgh",
         "firstname":"MARCO",
         "lastname":"Polo"
      }
   }
}
```
