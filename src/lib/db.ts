import { MongoClient, ServerApiVersion } from "mongodb";

const uri =
  "mongodb+srv://admin:Welcome%40mint1@cluster0.am9m8f2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export async function insertOne(collectionName: string, newDocument: any) {
  try {
    await client.connect();

    const database = client.db("zeto");
    const collection = database.collection(collectionName);

    // return collection;

    // // Fetch documents from the collection
    // const documents = await collection.find({}).toArray();
    // console.log("Documents:", documents);

    // // Add a new document to the collection
    const result = await collection.insertOne(newDocument);
    console.log("Document inserted with _id:", result.insertedId);
  } catch (err) {
    console.log("err");
    throw err;
  } finally {
    // Close the connection to the MongoDB server
    await client.close();
  }
}

export async function findOne(collectionName: string, queryField: any) {
  try {
    await client.connect();

    const database = client.db("zeto");
    const collection = database.collection(collectionName);

    // return collection;

    // // Fetch documents from the collection
    const documents = await collection
      .find({ ethAddress: queryField })
      .toArray();
    console.log("Documents:", documents);

    return documents;
  } catch (err) {
    console.log("err");
    throw err;
  } finally {
    // Close the connection to the MongoDB server
    await client.close();
  }
}

export async function deleteMany(collectionName: string, queryField: any) {
  try {
    await client.connect();

    const database = client.db("zeto");
    const collection = database.collection(collectionName);

    // return collection;

    // // Fetch documents from the collection
    const documents = await collection.deleteMany(queryField);

    console.log("Documents:", documents);

    return documents;
  } catch (err) {
    console.log("err");
    throw err;
  } finally {
    // Close the connection to the MongoDB server
    await client.close();
  }
}

export async function updateOne(
  collectionName: string,
  filter: any,
  update: any
) {
  try {
    await client.connect();

    const database = client.db("zeto");
    const collection = database.collection(collectionName);

    // return collection;

    // // Fetch documents from the collection
    console.log("3esdgf", filter, update);
    const documents = await collection.updateOne(filter, update);

    console.log("Documents:", documents);

    return documents;
  } catch (err) {
    console.log("err");
    throw err;
  } finally {
    // Close the connection to the MongoDB server
    await client.close();
  }
}
