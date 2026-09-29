import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";


function Navbar(){


    const navigate = useNavigate();

    const location = useLocation();


    const {
        dark,
        setDark
    } = useTheme();



    const token = localStorage.getItem(
        "token"
    );


    const username = localStorage.getItem(
        "username"
    );





    function logout(){


        localStorage.removeItem(
            "token"
        );


        localStorage.removeItem(
            "username"
        );


        navigate("/login");


    }






    function active(path){


        return location.pathname === path

        ?

        "text-blue-400 font-bold"

        :

        "text-gray-300 hover:text-blue-400";


    }







return(


<nav className="
bg-gray-900
dark:bg-black
text-white
px-8
py-4
flex
justify-between
items-center
shadow-lg
transition-all
duration-300
">



{/* LOGO */}


<h1

onClick={()=>navigate("/")}

className="
text-xl
font-bold
cursor-pointer
hover:text-blue-400
transition
"

>

🛡️ CyberGuard AI

</h1>







<div className="
flex
items-center
gap-5
">





{

token

?

<>



<button

onClick={()=>navigate("/")}

className={
active("/")
}

>

Home

</button>





<button

onClick={()=>navigate("/dashboard")}

className={
active("/dashboard")
}

>

Dashboard

</button>






<button

onClick={()=>navigate("/history")}

className={
active("/history")
}

>

History

</button>







<button

onClick={()=>navigate("/profile")}

className={`
${active("/profile")}
flex
items-center
gap-1
`}

>

👤 {username}

</button>








{/* DARK MODE BUTTON */}


<button

onClick={()=>setDark(!dark)}

className="
bg-gray-700
hover:bg-gray-600
px-3
py-2
rounded-lg
transition
"

>

{

dark

?

"☀️"

:

"🌙"

}

</button>







<button

onClick={logout}

className="
bg-red-600
hover:bg-red-700
px-4
py-2
rounded-lg
font-bold
transition
"

>

Logout

</button>




</>






:





<>



<button

onClick={()=>navigate("/login")}

className={
active("/login")
}

>

Login

</button>






<button

onClick={()=>navigate("/register")}

className="
bg-blue-600
hover:bg-blue-700
px-4
py-2
rounded-lg
font-bold
transition
"

>

Register

</button>



</>


}



</div>



</nav>


);


}


export default Navbar;