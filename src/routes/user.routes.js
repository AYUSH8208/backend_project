import  {Router}    from    "express"
import  {registerUser,loginUser,logoutUser,refreshAccesToken}  from    "../controllers/user.controller.js"
import  {upload}    from    "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
const   router=Router()
router.route("/resgister").post(
    upload.fields(
        [
           { name:"avatar",
            maxcount:1
           },
           {
            name:"coverImage",
            maxcount:1
           }
        ]
    ),
    
    registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccesToken)

export  default router