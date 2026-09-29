import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";


function Home(){


const navigate = useNavigate();



return(


<div className="
min-h-screen
bg-gray-100
dark:bg-gray-900
transition-colors
duration-300
">


<Navbar />





{/* HERO */}


<section className="
max-w-6xl
mx-auto
px-6
py-20
">


<div className="text-center">



<h1 className="
text-5xl
font-bold
text-gray-900
dark:text-white
">

🛡️ CyberGuard AI

</h1>




<p className="
text-2xl
mt-5
text-blue-600
dark:text-blue-400
font-semibold
">

AI Website Security Scanner

</p>




<p className="
mt-5
text-gray-600
dark:text-gray-400
max-w-2xl
mx-auto
">

Protect your website with automated
security checking. Detect HTTPS,
SSL certificate problems and security
header weaknesses using AI.

</p>





<div className="
flex
justify-center
gap-5
mt-8
">



<button

onClick={()=>navigate("/dashboard")}

className="
bg-blue-600
text-white
px-8
py-3
rounded-xl
font-bold
hover:bg-blue-700
transition-colors
"

>

Start Scan

</button>



</div>



</div>


</section>









{/* FEATURES */}



<section className="
max-w-6xl
mx-auto
px-6
pb-20
">


<h2 className="
text-3xl
font-bold
text-center
mb-10
text-gray-900
dark:text-white
">

Powerful Security Features

</h2>





<div className="
grid
md:grid-cols-3
gap-6
">





<div className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-6
transition-colors
">


<h3 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

🔒 HTTPS Scanner

</h3>


<p className="
mt-3
text-gray-600
dark:text-gray-400
">

Check whether website connection
is secure.

</p>


</div>







<div className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-6
transition-colors
">


<h3 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

📜 SSL Checker

</h3>


<p className="
mt-3
text-gray-600
dark:text-gray-400
">

Analyze SSL certificate validity
and status.

</p>


</div>







<div className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-6
transition-colors
">


<h3 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

🤖 AI Security Report

</h3>


<p className="
mt-3
text-gray-600
dark:text-gray-400
">

Generate explanation and
recommendations automatically.

</p>


</div>




</div>



</section>








{/* HOW IT WORKS */}



<section className="
bg-white
dark:bg-gray-800
py-16
transition-colors
">


<h2 className="
text-3xl
font-bold
text-center
mb-10
text-gray-900
dark:text-white
">

How It Works

</h2>




<div className="
max-w-5xl
mx-auto
grid
md:grid-cols-3
gap-6
px-6
">



<div className="
text-center
">

<h3 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

1. Enter Website

</h3>


<p className="mt-3 text-gray-600 dark:text-gray-400">

Insert website URL.

</p>


</div>





<div className="
text-center
">


<h3 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

2. AI Scan

</h3>


<p className="mt-3 text-gray-600 dark:text-gray-400">

System checks security.

</p>


</div>





<div className="
text-center
">


<h3 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

3. Get Report

</h3>


<p className="mt-3 text-gray-600 dark:text-gray-400">

Receive security score.

</p>


</div>




</div>



</section>








{/* FOOTER */}



<footer className="
bg-gray-900
dark:bg-black
text-white
text-center
py-6
transition-colors
">


<p>

© 2026 CyberGuard AI

</p>


</footer>




</div>


);


}


export default Home;