import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";


function Login(){


const navigate = useNavigate();



const [username,setUsername] = useState("");

const [password,setPassword] = useState("");

const [loading,setLoading] = useState(false);





async function login(){



if(!username || !password){


alert(
"Please fill all fields"
);


return;


}



try{


setLoading(true);



const response = await axios.post(

"http://127.0.0.1:8000/login",

{

username,

password

}

);




if(response.data.token){



localStorage.setItem(

"token",

response.data.token

);



localStorage.setItem(

"username",

username

);



alert(
"Login successful"
);



navigate("/dashboard");



}

else{


alert(
"Invalid username or password"
);


}




}



catch(error){



console.log(error);


alert(
"Login failed"
);



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

Login to your account

</p>






<div className="space-y-4">



<input


className="
w-full
border
border-gray-300
dark:border-gray-600
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
"


placeholder="Username"


value={username}


onChange={
(e)=>setUsername(e.target.value)
}


/>






<input


type="password"


className="
w-full
border
border-gray-300
dark:border-gray-600
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
"


placeholder="Password"


value={password}


onChange={
(e)=>setPassword(e.target.value)
}


/>






<button


onClick={login}


className="
w-full
bg-blue-600
hover:bg-blue-700
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

"Logging in..."

:

"Login"

}


</button>



</div>







<p className="
text-center
mt-6
text-gray-600
dark:text-gray-400
">


Don't have account?


{" "}


<Link

to="/register"

className="
text-blue-600
dark:text-blue-400
font-bold
"

>

Register

</Link>



</p>






</div>



</div>



);


}


export default Login;