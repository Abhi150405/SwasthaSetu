import 'dotenv/config'
import connectDB from './db/db.js'
import { app } from './app.js'

connectDB()
.then(()=>{
  app.on("error",(error)=>{
    console.log("Error: ",error)
    throw error
  })

  app.listen(process.env.PORT || 5001,()=>{
    console.log(`Server is Up:${process.env.PORT}`)
  } )
})

.catch((err)=>{
  console.log("MongoDB connection failed",err)
})