import  {asyncHandler}  from    "../utils/asyncHandler.js"
import  {Apierror}  from   "../utils/Apierror.js"
import  {User} from "../models/user.model.js"
import  {upload} from "../middlewares/multer.middleware.js"
import  {uploadOnCloudinary} from "../utils/cloudinary.js"
import {Apiresponse } from "../utils/Apiresponse.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
const generateAccessTokenAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateReFreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        
        return{accessToken,refreshToken}
    } catch (error) {
        throw new Apierror(500,"something went wrong while generating access token and refresh token")
    }
}
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
const loginUser=asyncHandler(async(req,res)=>{
    //get data from user
    //validation -not empty
    //check user in db 
    //check password in db
    //generate access token and refresh token 
    //send cookie
    //return  response
   const {email,username,password}=req.body
   console.log(email);
   if(!(username||email)){
    throw new Apierror(400,"Username or password is required")
   }
   const user= await User.findOne({
    $or:[{username},{email}]
   })
   if(!user){
    throw new Apierror(404,"user is not reistered")
   }
   const isPasswordValid=await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new Apierror(401,"Invalid user credentials")
   }
   const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id)

   const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

   const options={
    httpOnly:true,
    secure:true
   }
   return   res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
   .json(
    new Apiresponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
    )
   )
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
            refreshToken:1
        }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
       }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new Apiresponse(200,{},"User logged out succesfully")
    )
})

const refreshAccesToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookie.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new Apierror(401,"unauthorized request")
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new Apierror(401,"invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new Apierror(401,"refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}=await generateAccessTokenAndRefreshToken(user._id)
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options)
        .json(
            new Apiresponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new Apierror(401,error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new Apierror(400,"Password is incorrect")
    }
    user.password=newPassword
    await   user.save({validateBeforeSave:false})
    return  res.status(200)
    .json(
        new Apiresponse(200,{},"Password is Changed Succesfully")
    )
})

const currentUser=asyncHandler(async(req,res)=>{
    return  res.status(200)
    .json(200,req.user,"user fetched succesfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new Apierror(400,"All fields are required")
    }

    const user=User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new Apiresponse(
            200,user,"Account details updated succesfully"
        )
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new Apierror(400,"avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new Apierror(400,"Error while uplaoding on avatar file")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:avatar.url}
        },{
            new:true
        }
    ).select("-password")

    return  res
    .status(200)
    .json(
        new Apiresponse(200,user,"avatar  is updated")
    )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalpath=req.file?.path
    if(!coverImageLocalpath){
        throw new Apierror(400,"CoverImage file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalpath)

    if(!coverImage.url){
        throw new Apierror(400,"Error while uplaoding on coverImage file")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{coverImage:coverImage.url}
        },{
            new:true
        }
    ).select("-password")

    return  res
    .status(200)
    .json(
        new Apiresponse(200,user,"cover image  is updated")
    )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new Apierror(400,"username is missing")
    }
    const channel=User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"Subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"Subscription",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            } 
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }   
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    if(!channel?.length){
        throw new Apierror(400,"channel does not exist")
    }

    return  res
    .status(200)
    .json(
        new Apiresponse(200,channel[0],"user channel fetched succesfully")
    )
})

export  {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccesToken,
    changeCurrentPassword,
    currentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}