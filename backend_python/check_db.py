import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def main():
    load_dotenv()
    uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'SWASTHASETU')
    print(f"Connecting to {uri}/{db_name}...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    try:
        collections = await db.list_collection_names()
        print("Collections in database:", collections)
        
        # Check users
        users_count = await db['users'].count_documents({})
        print(f"Total users: {users_count}")
        
        # Check progresstrackers
        progress_count = await db['progresstrackers'].count_documents({})
        print(f"Total progress trackers: {progress_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
