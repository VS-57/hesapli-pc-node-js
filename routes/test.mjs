import express from "express";
import { MongoClient } from "mongodb";

const router = express.Router();

// MongoDB connection details
const mongoUrl =
  "mongodb://mongo:cSYFqpPbEyjwsAoNzrdfWYNJooWXsGOI@autorack.proxy.rlwy.net:48747";
const dbName = "ucuzasistem"; // Replace with your actual database name
const collectionName = "products"; // Replace with your actual collection name

router.get("/", async (req, res) => {
  let client;

  try {
    // Create a new MongoClient
    client = new MongoClient(mongoUrl);

    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected to MongoDB");

    // Get the database and collection
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Fetch the product list from MongoDB
    const productList = await collection.find({}).toArray();

    // Send the product list as a JSON response
    res.json(productList);
  } catch (error) {
    console.error("Error details:", error); // More detailed error logging
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message }); // Send error message to the client
  } finally {
    // Ensure the client is closed when you are done
    if (client) {
      await client.close();
    }
  }
});

export default router;
