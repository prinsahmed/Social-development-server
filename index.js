const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const port = 3000;


app.use(express.json())
app.use(cors());





const uri = "mongodb+srv://myserver:1O7RI49eqHqgu6e7@cluster0.ufqnoyu.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const eventDB = client.db('eventDB');
        const createEvent = eventDB.collection('createEvent')
        const joinEvent = eventDB.collection('joinEvent')


        app.post('/create-event', async (req, res) => {
            const eventData = req.body;
            const result = await createEvent.insertOne(eventData);
            res.send(result)

        })


        app.get('/events', async (req, res) => {

            const result = await createEvent.find().toArray()
            res.send(result)
        })


        app.get('/event-details/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) }
            const result = await createEvent.findOne(query)
            res.send(result)
            console.log(id)
        })

        // need middleware
        app.post('/join-event', async (req, res) => {
            const joinEventData = req.body;
            const result = await joinEvent.insertOne(joinEventData);
            res.send(result);
        })

        app.get('/joined-event', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await joinEvent.find(query).toArray()
            res.send(result)
        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port)