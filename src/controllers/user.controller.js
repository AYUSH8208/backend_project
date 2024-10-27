import  {asyncHandler}  from    "../utils/asyncHandler.js"
import  {Apierror}  from   "../utils/Apierror.js"
import  {User} from "../models/user.model.js"
import  {upload} from "../middlewares/multer.middleware.js"
import  {uploadOnCloudinary} from "../utils/cloudinary.js"
import {Apiresponse } from "../utils/Apiresponse.js"
const   registerUser=asyncHandler(async(req,res)=>{
   //get    user details from frontend
   //validation -not empty
   //check udser already exists or not
   //check for imges ,check for avatar
   //uplaod to cloudinary
   //create user object-create entry in db
   //remove password and refresh token field from response
   //check for user creation 
   //return  response

   const {fullname,email,username,password}=req.body
    //console.log("email: ",email)
    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new Apierror(400,"All fields are compulsary")
    }
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new Apierror(400,"user with given Username and email already exits")
    }
    const  avatarLocalPath=req.files?.avatar[0]?.path;
    //const coverImageLocalpath=req.files?.coverImage[0]?.path;
    let coverImageLocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalpath=req.files?.coverImage[0]?.path
    }
    if(!avatarLocalPath){
        throw new Apierror(400,"avatar file is required");
    }
    const  avatar=await   uploadOnCloudinary(avatarLocalPath)
    const  coverImage=await uploadOnCloudinary(coverImageLocalpath)
    if(!avatar){
        throw new Apierror(400,"avatar file is required");

    }
    const user=await   User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })

    const   createduser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createduser){
        throw new Apierror(500,"something went wrong while registering user")
    }

    return res.status(201).json(
        new Apiresponse(200,createduser,"User register succesfully")
    )
})

export  {registerUser}