import { v2 as cloudinary} from "cloudinary";
import  fs  from    "fs"


cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const  uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath)return    null;
        //file  uplaoding
        const   resonse=await   cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file` is `being` uplaoded` succesfully
        //console.log("file   has been    uploaded    on  clodinary",resonse.url);
        fs.unlinkSync(localFilePath)
        return  resonse;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return  null;
    }
}
export  {uploadOnCloudinary}