

require('dotenv').config()

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN )




// api for sending otp to the user mobile number....
   const  generateOtp = (mobileNo) => {
        return new Promise((resolve, reject) =>{
            client.verify
            .services(process.env.TWILIO_SERVICE_SID)
            .verifications
            .create({
                to : `+91${mobileNo}`,
                channel :'sms'
            })
            .then((verifications) => {
               resolve(verifications.sid);
            });
        })
        
    }

// api for verifying the otp recived by the user 
    const verifyOtp =(mobileNo,otp) =>{
        // console.log("mobile and otp")
        console.log(mobileNo,otp)
        return new Promise((resolve, reject) =>{
            client.verify
            .services(process.env.TWILIO_SERVICE_SID)
            .verificationChecks
            .create({
                to : `+91${mobileNo}`,
                code : otp
            })
            .then((verifications) => {
                console.log('verified otp');
               resolve(verifications)
            })
        })
    }
module.exports={generateOtp,verifyOtp}
