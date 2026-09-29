import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";
import Navbar from "./Navbar";


function getPasswordStrength(password){


    if(password.length === 0){

        return { label: "", barColor: "", textColor: "", width: "0%" };

    }


    let score = 0;

    if(password.length >= 8) score++;

    if(/[A-Z]/.test(password)) score++;

    if(/[a-z]/.test(password)) score++;

    if(/[0-9]/.test(password)) score++;

    if(/[^A-Za-z0-9]/.test(password)) score++;


    if(score <= 2){

        return { label: "Weak 🔴", barColor: "bg-red-500", textColor: "text-red-500", width: "33%" };

    }

    if(score === 3){

        return { label: "Medium 🟡", barColor: "bg-yellow-500", textColor: "text-yellow-500", width: "66%" };

    }

    return { label: "Strong 🟢", barColor: "bg-green-500", textColor: "text-green-500", width: "100%" };


}



const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



function Profile(){


const navigate = useNavigate();

const [loading,setLoading] = useState(true);


const [username,setUsername] = useState("");

const [email,setEmail] = useState("");

const [profileErrors,setProfileErrors] = useState({});

const [savingProfile,setSavingProfile] = useState(false);


const [currentPassword,setCurrentPassword] = useState("");

const [newPassword,setNewPassword] = useState("");

const [confirmNewPassword,setConfirmNewPassword] = useState("");

const [passwordErrors,setPasswordErrors] = useState({});

const [savingPassword,setSavingPassword] = useState(false);


const strength = getPasswordStrength(newPassword);




useEffect(()=>{


async function fetchProfile(){

try{

const res = await API.get("/profile");

setUsername(res.data.username);

setEmail(res.data.email);

}

catch(err){

console.log(err);

}

finally{

setLoading(false);

}

}


fetchProfile();


},[]);




function validateProfile(){


const errors = {};


if(username.trim().length < 3){

errors.username = "Username must be at least 3 characters";

}

else if(/\s/.test(username)){

errors.username = "Username cannot contain spaces";

}


if(!EMAIL_REGEX.test(email)){

errors.email = "Invalid email format";

}


setProfileErrors(errors);


return Object.keys(errors).length === 0;


}




async function saveProfile(){


if(!validateProfile()){

return;

}


try{

setSavingProfile(true);


const res = await API.put("/profile", {

username,

email

});


if(res.data.error){

alert(res.data.error);

return;

}


if(res.data.username_changed){

alert("Username changed successfully. Please log in again.");

localStorage.removeItem("token");

localStorage.removeItem("username");

navigate("/login");

return;

}


alert("Profile updated successfully");


}

catch(err){

console.log(err);

alert("Failed to update profile");

}

finally{

setSavingProfile(false);

}


}




function validatePassword(){


const errors = {};


if(!currentPassword){

errors.currentPassword = "Please enter your current password";

}


if(newPassword.length < 8){

errors.newPassword = "Password must be at least 8 characters";

}

else if(!/[A-Z]/.test(newPassword)){

errors.newPassword = "Password must contain an uppercase letter";

}

else if(!/[a-z]/.test(newPassword)){

errors.newPassword = "Password must contain a lowercase letter";

}

else if(!/[0-9]/.test(newPassword)){

errors.newPassword = "Password must contain a number";

}


if(confirmNewPassword !== newPassword){

errors.confirmNewPassword = "Passwords do not match";

}


setPasswordErrors(errors);


return Object.keys(errors).length === 0;


}




async function savePassword(){


if(!validatePassword()){

return;

}


try{

setSavingPassword(true);


const res = await API.put("/profile/password", {

current_password: currentPassword,

new_password: newPassword

});


if(res.data.error){

alert(res.data.error);

return;

}


alert("Password changed successfully");


setCurrentPassword("");

setNewPassword("");

setConfirmNewPassword("");

setPasswordErrors({});


}

catch(err){

console.log(err);

alert("Failed to change password");

}

finally{

setSavingPassword(false);

}


}




if(loading){

return(

<div className="
min-h-screen
bg-gray-100
dark:bg-gray-900
transition-colors
duration-300
">

<Navbar />

<p className="
text-center
mt-10
text-gray-700
dark:text-gray-300
">

Loading...

</p>

</div>

);

}




return(


<div className="
min-h-screen
bg-gray-100
dark:bg-gray-900
transition-colors
duration-300
">


<Navbar />



<div className="max-w-2xl mx-auto p-8">


<button

onClick={()=>navigate("/dashboard")}

className="
mb-4
text-gray-600
dark:text-gray-300
hover:text-blue-600
dark:hover:text-blue-400
font-bold
flex
items-center
gap-2
transition-colors
"

>

← Back to Dashboard

</button>



<h1 className="
text-3xl
font-bold
mb-6
text-gray-900
dark:text-white
">

👤 My Profile

</h1>




{/* PERSONAL INFORMATION */}


<div className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-6
mb-6
transition-colors
">


<h2 className="
text-xl
font-bold
mb-4
text-gray-900
dark:text-white
">

Personal Information

</h2>




<div className="space-y-4">


<div>

<label className="
block
text-sm
font-bold
text-gray-700
dark:text-gray-300
mb-1
">

Username

</label>

<input

className={`
w-full
border
${profileErrors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
p-3
rounded-lg
`}

value={username}

onChange={(e)=>setUsername(e.target.value)}

/>

{

profileErrors.username &&

<p className="text-red-500 text-sm mt-1">{profileErrors.username}</p>

}

</div>




<div>

<label className="
block
text-sm
font-bold
text-gray-700
dark:text-gray-300
mb-1
">

Email

</label>

<input

type="email"

className={`
w-full
border
${profileErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
p-3
rounded-lg
`}

value={email}

onChange={(e)=>setEmail(e.target.value)}

/>

{

profileErrors.email &&

<p className="text-red-500 text-sm mt-1">{profileErrors.email}</p>

}

</div>



<p className="
text-xs
text-gray-500
dark:text-gray-400
">

⚠️ Changing your username will log you out — you'll need to log in again with the new username.

</p>



<button

onClick={saveProfile}

disabled={savingProfile}

className="
bg-blue-600
hover:bg-blue-700
disabled:opacity-50
text-white
px-6
py-3
rounded-lg
font-bold
transition-colors
"

>

{

savingProfile

?

"Saving..."

:

"Save Changes"

}

</button>


</div>


</div>




{/* CHANGE PASSWORD */}


<div className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-6
transition-colors
">


<h2 className="
text-xl
font-bold
mb-4
text-gray-900
dark:text-white
">

Change Password

</h2>




<div className="space-y-4">


<div>

<input

type="password"

className={`
w-full
border
${passwordErrors.currentPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
p-3
rounded-lg
`}

placeholder="Current Password"

value={currentPassword}

onChange={(e)=>setCurrentPassword(e.target.value)}

/>

{

passwordErrors.currentPassword &&

<p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>

}

</div>




<div>

<input

type="password"

className={`
w-full
border
${passwordErrors.newPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
p-3
rounded-lg
`}

placeholder="New Password"

value={newPassword}

onChange={(e)=>setNewPassword(e.target.value)}

/>



{

newPassword.length > 0 &&


<div className="mt-2">

<div className="
w-full
h-2
bg-gray-200
dark:bg-gray-600
rounded-full
overflow-hidden
">

<div

className={`h-full ${strength.barColor} transition-all duration-300`}

style={{ width: strength.width }}

>

</div>

</div>

<p className={`text-sm mt-1 font-semibold ${strength.textColor}`}>

{strength.label}

</p>

</div>

}



{

passwordErrors.newPassword &&

<p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>

}

</div>




<div>

<input

type="password"

className={`
w-full
border
${passwordErrors.confirmNewPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
p-3
rounded-lg
`}

placeholder="Confirm New Password"

value={confirmNewPassword}

onChange={(e)=>setConfirmNewPassword(e.target.value)}

/>

{

passwordErrors.confirmNewPassword &&

<p className="text-red-500 text-sm mt-1">{passwordErrors.confirmNewPassword}</p>

}

</div>




<button

onClick={savePassword}

disabled={savingPassword}

className="
bg-blue-600
hover:bg-blue-700
disabled:opacity-50
text-white
px-6
py-3
rounded-lg
font-bold
transition-colors
"

>

{

savingPassword

?

"Updating..."

:

"Update Password"

}

</button>


</div>


</div>



</div>


</div>


);


}


export default Profile;