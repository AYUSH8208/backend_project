import  connectDB   from "./db/db.js"
import  dotenv  from    'dotenv'

dotenv.config({
    path:'./env'
})

connectDB()




// (async()=>{
//     try{
//         await   mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME} `)
//         app.on("error",(error)=>{
//             console.log("Error",error);
//             throw   error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening   on  port    ${process.env.PORT}`)
//         })
//     }catch(error){
//         console.error("Error",error)
//         throw err
//     }
// })()