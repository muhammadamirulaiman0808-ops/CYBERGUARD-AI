import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";


// Standard email format check — accepts any valid domain
// (gmail, yahoo, university domains, company domains, etc.)
// Only checks format: something@something.something
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function getPasswordStrength(password){


    if(password.length === 0){

        return {
            label: "",
            barColor: "",
            textColor: "",
            width: "0%"
        };

    }


    let score = 0;

    if(password.length >= 8) score++;

    if(/[A-Z]/.test(password)) score++;

    if(/[a-z]/.test(password)) score++;

    if(/[0-9]/.test(password)) score++;

    if(/[^A-Za-z0-9]/.test(password)) score++; // symbol — bonus, optional


    if(score <= 2){

        return {
            label: "Weak 🔴",
            barColor: "bg-red-500",
            textColor: "text-red-500",
            width: "33%"
        };

    }


    if(score === 3){

        return {
            label: "Medium 🟡",
            barColor: "bg-yellow-500",
            textColor: "text-yellow-500",
            width: "66%"
        };

    }


    return {
        label: "Strong 🟢",
        barColor: "bg-green-500",
        textColor: "text-green-500",
        width: "100%"
    };


}



function Register(){


const navigate = useNavigate();


const [username,setUsername] = useState("");

const [email,setEmail] = useState("");

const [password,setPassword] = useState("");

const [confirmPassword,setConfirmPassword] = useState("");

const [loading,setLoading] = useState(false);

const [errors,setErrors] = useState({});


const strength = getPasswordStrength(password);




function validate(){


    const newErrors = {};


    // USERNAME: min 3 chars, no whitespace

    if(username.trim().length < 3){

        newErrors.username = "Username mesti sekurang-kurangnya 3 aksara";

    }

    else if(/\s/.test(username)){

        newErrors.username = "Username tidak boleh ada ruang kosong";

    }



    // EMAIL: standard format check, any domain accepted

    if(!EMAIL_REGEX.test(email)){

        newErrors.email = "Format email tidak sah (contoh: nama@domain.com)";

    }



    // PASSWORD: min 8, uppercase, lowercase, number (symbol optional)

    if(password.length < 8){

        newErrors.password = "Password mesti sekurang-kurangnya 8 aksara";

    }

    else if(!/[A-Z]/.test(password)){

        newErrors.password = "Password mesti ada huruf besar";

    }

    else if(!/[a-z]/.test(password)){

        newErrors.password = "Password mesti ada huruf kecil";

    }

    else if(!/[0-9]/.test(password)){

        newErrors.password = "Password mesti ada nombor";

    }



    // CONFIRM PASSWORD

    if(confirmPassword !== password){

        newErrors.confirmPassword = "Password tidak sepadan";

    }



    setErrors(newErrors);


    return Object.keys(newErrors).length === 0;


}




async function register(){


if(!validate()){

    return;

}



try{


setLoading(true);



await axios.post(

"http://127.0.0.1:8000/register",

{

username,

email,

password

}

);




alert(
"Registration successful"
);



navigate("/login");



}



catch(error){


console.log(error);


const message =

error.response?.data?.error

||

"Registration failed";


alert(message);


}



finally{


setLoading(false);


}



}







return(


<div className="
min-h-screen
bg-gray-100
dark:bg-gray-900
flex
items-center
justify-center
transition-colors
duration-300
relative
">



<button

onClick={()=>navigate("/")}

className="
absolute
top-6
left-6
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

← Back to Home

</button>




<div className="
bg-white
dark:bg-gray-800
shadow-xl
rounded-2xl
p-8
w-full
max-w-md
transition-colors
">





<h1 className="
text-3xl
font-bold
text-center
mb-2
text-gray-900
dark:text-white
">

🛡️ CyberGuard AI

</h1>



<p className="
text-center
text-gray-500
dark:text-gray-400
mb-8
">

Create your account

</p>







<div className="space-y-4">



{/* USERNAME */}


<div>

<input


className={`
w-full
border
${errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
`}


placeholder="Username"


value={username}


onChange={
(e)=>setUsername(e.target.value)
}


/>


{

errors.username &&

<p className="text-red-500 text-sm mt-1">

{errors.username}

</p>

}

</div>





{/* EMAIL */}


<div>

<input


type="email"


className={`
w-full
border
${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
`}


placeholder="Email"


value={email}


onChange={
(e)=>setEmail(e.target.value)
}


/>


{

errors.email &&

<p className="text-red-500 text-sm mt-1">

{errors.email}

</p>

}

</div>





{/* PASSWORD */}


<div>

<input


type="password"


className={`
w-full
border
${errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
`}


placeholder="Password"


value={password}


onChange={
(e)=>setPassword(e.target.value)
}


/>



{/* PASSWORD STRENGTH METER */}


{

password.length > 0 &&


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

className={`
h-full
${strength.barColor}
transition-all
duration-300
`}

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

errors.password &&

<p className="text-red-500 text-sm mt-1">

{errors.password}

</p>

}

</div>





{/* CONFIRM PASSWORD */}


<div>

<input


type="password"


className={`
w-full
border
${errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
`}


placeholder="Confirm Password"


value={confirmPassword}


onChange={
(e)=>setConfirmPassword(e.target.value)
}


/>


{

errors.confirmPassword &&

<p className="text-red-500 text-sm mt-1">

{errors.confirmPassword}

</p>

}

</div>








<button


onClick={register}


disabled={loading}


className="
w-full
bg-blue-600
hover:bg-blue-700
disabled:opacity-50
text-white
py-3
rounded-lg
font-bold
transition-colors
"

>


{

loading

?

"Creating account..."

:

"Register"

}


</button>





</div>








<p className="
text-center
mt-6
text-gray-600
dark:text-gray-400
">


Already have account?


{" "}



<Link

to="/login"

className="
text-blue-600
dark:text-blue-400
font-bold
"

>

Login

</Link>



</p>







</div>




</div>


);


}


export default Register;