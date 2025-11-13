const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const cors = require('cors');
const app = express();
const port = 3000;
const dotenv = require('dotenv')



dotenv.config();

app.use(express.json())
app.use(cors());

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const eventDB = client.db('eventDB');
        const createEvent = eventDB.collection('createEvent')
        const joinEvent = eventDB.collection('joinEvent')
        const today = new Date();




        async function authenticateToken(req, res, next) {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).send({ error: "No token provided" });
            }

            const idToken = authHeader.split(" ")[1];

            try {

                const decodedToken = await admin.auth().verifyIdToken(idToken);
                req.user = decodedToken;


                next();
            } catch (err) {

                console.error(err);
                res.status(401).send({ error: "Invalid or expired token" });
            }
        }


        app.get('/', (req, res) => {
            res.send("Server is running")
        })



        app.post('/create-event', async (req, res) => {
            const eventData = req.body;
            const { title, description, eventCat, selectedDate, location, photoURL } = eventData;


            if (!title || title.trim() === "") {
                return res.status(400).send({ error: "Title is required" });
            }
            if (!description || description.trim().length < 10) {
                return res.status(400).send({ error: "Description must be at least 10 characters" });
            }
            if (!["Cleanup", "Plantation", "Donation", "Awareness"].includes(eventCat)) {
                return res.status(400).send({ error: "Invalid event type" });
            }
            if (!selectedDate || new Date(selectedDate) < new Date()) {
                return res.status(400).send({ error: "Date must be in the future" });
            }
            if (!location || location.length === 0) {
                return res.status(400).send({ error: "Location is required" });
            }
            if (!photoURL) {
                return res.status(400).send({ error: "Photo is required" });
            }


            const result = await createEvent.insertOne(eventData);
            res.send(result)

        })


        app.get('/events', async (req, res) => {
            const { category, q } = req.query;
            console.log(q, category);

            const result = await createEvent.aggregate([

                {
                    $addFields: {
                        selectedDateObj: { $toDate: "$selectedDate" }
                    }
                },
                {
                    $match: {
                        selectedDateObj: { $gte: today },
                        ...(category ? { eventCat: category } : {}),
                        ...(q
                            ? {
                                $or: [
                                    { title: { $regex: q.trim(), $options: "i" } },
                                ]
                            }
                            : {})
                    }

                },
                { $sort: { selectedDateObj: 1 } }

            ]).toArray();




            res.send(result)
        })


        app.get(['/event-details/:id', '/edit-event/:id'], async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) }
            const result = await createEvent.findOne(query)
            res.send(result)

        })


        app.post('/join-event', async (req, res) => {
            const joinEventData = req.body;
            const result = await joinEvent.insertOne(joinEventData);
            res.send(result);
            console.log(joinEventData);
        })

        app.get('/joined-event', authenticateToken, async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            };
            const sortFields = { selectedDate: -1 }
            const result = await joinEvent.find(query).sort(sortFields).toArray()
            res.send(result)

        })


        app.get('/manage-event', authenticateToken, async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await createEvent.find(query).toArray()
            res.send(result)
        })


        app.put('/update-event/:id', authenticateToken, async (req, res) => {
            const { id } = req.params;
            const query = { _id: new ObjectId(id) }
            const updatedData = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...updatedData
                }
            };

            const result = await createEvent.updateOne(query, updateDoc, options);
            res.send(result);


        })




        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.listen(port)




