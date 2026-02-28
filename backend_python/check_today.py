import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, time

async def main():
    load_dotenv()
    uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'SWASTHASETU')
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Get today at 00:00:00
    today = datetime.combine(datetime.now(), time.min)
    
    print(f"Checking tracking data for date: {today}")
    
    # Check if any progress trackers exist for today
    trackers = await db['progresstrackers'].find({"date": today}).to_list(length=100)
    print(f"Daily trackers found for today: {len(trackers)}")
    
    # List all collections again to be sure
    collections = await db.list_collection_names()
    print(f"All collections: {collections}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
