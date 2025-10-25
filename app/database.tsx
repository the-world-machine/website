'use server'
import axios, { all } from 'axios';
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { UserData, LeaderboardUser, ItemData, NikogotchiInformation, NikogotchiData, BlogPost } from './components/database-parse-type'

let collection: null | Collection<any> = null


const uri = process.env.NEXT_PUBLIC_DB_URI as string
const dbClient: MongoClient = new MongoClient(uri)
dbClient.connect()

async function isConnected(client: MongoClient) {
  if (!client) {
    return false;
  }
  try {
    const adminDb = client.db().admin();
    const result = await adminDb.ping();
    return result && result.ok === 1;
  } catch (error) {
		client.close()
    return false;
  }
}
async function getCollection(name: string) {
    if (collection != null) { return collection }
		if (await isConnected(dbClient)) await dbClient.connect()

    const db = dbClient.db('TheWorldMachine')

    return db.collection<any>(name)
}

export async function Fetch(user: string): Promise<UserData | null> {
    const user_data_collection = await getCollection("UserData");
    const userDataFromDB = await user_data_collection.findOne({ _id: user });

    // Check if userDataFromDB is not null
    if (userDataFromDB) {
        // Use type assertion here
        return userDataFromDB;
    }
    else {
        const defaultData = new UserData()
        await user_data_collection.insertOne({ _id: user, ...defaultData })
        return Fetch(user)
    }
}


export async function GetNikogotchiData(user: string): Promise<NikogotchiData | null> {
    const user_data_collection = await getCollection('UserNikogotchis');
    const userDataFromDB = await user_data_collection.findOne({ _id: user });
    
    if (userDataFromDB) {
        return userDataFromDB as unknown as NikogotchiData;
    } else {
        return null;
    }
}


export async function Update(user: Partial<UserData>, filter: Array<String>) {
    const user_data_collection = await getCollection("UserData");

    const filteredData: { [key: string]: any } = {};
      
    filter.forEach(field => {
        if (user[field as keyof UserData] !== undefined) {
        filteredData[field as keyof UserData] = user[field as keyof UserData];
        }
    });

    try {
        const result = await user_data_collection.updateOne(
            { _id: user._id },
            { $set: filteredData }
        );
        console.log(result.matchedCount);
    } catch (error) {
        console.error('Error updating database: ' + error);
    }

    console.log(user);
}
export async function GetLeaderboard(sortBy: string) {
    const user_data_collection = await getCollection("UserData");
    const leaderboard: LeaderboardUser[] = [];

    try {
        const cursor = await user_data_collection.aggregate([{ $sort: { [sortBy]: -1 } }, { $limit: 10 }]);
        const result = await cursor.toArray();

        const userPromises = result.map(async (doc) => {
            const user = await GetDiscordData(doc._id);

            if (user === '') {
                return null; // Return null if the username is empty
            }

            return {
                name: user,
                type: sortBy,
                data: {
                    ...doc,
                    wool: doc.wool.toLocaleString()
                } as UserData
            } as LeaderboardUser; // Ensure the return type is LeaderboardUser
        });

        // Use Promise.all to wait for all promises to resolve
        const users = await Promise.all(userPromises);

        // Filter out null values and assert the type
        const validUsers: LeaderboardUser[] = users.filter((user): user is LeaderboardUser => user !== null);

        // Push the resolved data to the leaderboard array
        leaderboard.push(...validUsers);
    } catch (error) {
        console.error(error);
    }

    return leaderboard;
}


export async function FetchItemData() {

    const data = await getCollection('ItemData');

    const itemData = await data.findOne({ access: 'ItemData' });

    if (itemData) {
        return itemData as unknown as ItemData;
    } else {
        return null;
    }
}

const users: any = {};

export async function GetDiscordData(userID: string) {

    if (users[userID] === undefined) {
        const response = await axios.get(`https://discord.com/api/users/${userID}`, {
            headers: { 'Authorization': `Bot ${process.env.NEXT_PUBLIC_DISCORD_BOT_ID}` }
        })

        users[userID] = response.data.username;
    }
    
    return users[userID]
}

export async function GetBackgrounds() {
    const end_point = 'https://api.npoint.io/6940a9826da1e0473197/backgrounds';

    const responseBackgrounds = await fetch(end_point);
    return await responseBackgrounds.json();
}

export async function FetchBlogPosts() {

    const blogPosts: BlogPost[] = []

    const blogData = await getCollection('Blog');

    const blogPostList = await blogData.find({}).toArray();

    const blogPostPromises = blogPostList.map(async (blogDocs) => {
        return { ...blogDocs } as BlogPost
    });

    const allBlogPosts = await Promise.all(blogPostPromises);

    blogPosts.push(...allBlogPosts);

    return blogPosts
}

export async function UploadBlogPost(post: BlogPost) {

    if (post == undefined) {
        return;
    }

    const blogData = await getCollection('Blog');

    const result = await blogData.insertOne(post);

    if (result && result.insertedId) {
        console.log(`New post created with the following id: ${result.insertedId}`);
    } else {
        console.error('Failed to insert the blog post.');
    }
}