import mongoose,{Schema} from "mongoose"
const playlistSchema=new Schema({
    name:{
        type:String,
        req:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    description:{
        type:String,
        req:true
    },
    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }]

},{timestamps:true})

export const Playlist=mongoose.model("Playlist",playlistSchema)