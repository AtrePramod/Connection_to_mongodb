const { MongoClient } = require("mongodb")
const url = "mongodb://127.0.0.1:27017"
const client = new MongoClient(url)

const database = "bank"

async function getData() {


    let result = await client.connect()
    let db = result.db(database)
    let collection = db.collection("account");
    let res = await collection.find({}).toArray()
    console.log(res);
}
getData();