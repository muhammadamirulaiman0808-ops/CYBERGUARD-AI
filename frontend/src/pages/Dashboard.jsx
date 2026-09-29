import { useState, useEffect } from "react";
import API from "../api";
import Navbar from "../components/Navbar";
import AnimatedCard from "../components/AnimatedCard";
import LoadingScanner from "../components/LoadingScanner";
import SecurityCard from "../components/SecurityCard";

import {
    CircularProgressbar,
    buildStyles
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";
import { downloadPDF } from "../utils/pdfReport";

function Dashboard(){


    const [url,setUrl] = useState("");

    const [result,setResult] = useState(null);

    const [loading,setLoading] = useState(false);

    const [error,setError] = useState("");

    const [stats,setStats] = useState({

    total:0,

    average:0,

    safe:0,

    medium:0,

    high:0

});

    function formatURL(input){

        // Don't force https:// here — let the backend try https
        // first and fall back to http if the site doesn't support it.
        // Forcing https on an http-only site causes false
        // "SSL Invalid" / header check failures.

        return input.trim();

    }

useEffect(()=>{

    loadStats();

},[]);



async function loadStats(){

    try{

        const response = await API.get(
            "/history"
        );


        const data = response.data;


        if(data.length === 0){

            return;

        }


        let totalScore = 0;

        let safe = 0;

        let medium = 0;

        let high = 0;



        data.forEach((item)=>{


            totalScore += item.score;



            if(item.risk === "Low"){

                safe++;

            }

            else if(item.risk === "Medium"){

                medium++;

            }

            else{

                high++;

            }


        });



        setStats({

            total:data.length,

            average:
            Math.round(
                totalScore / data.length
            ),

            safe:safe,

            medium:medium,

            high:high

        });



    }

    catch(error){

        console.log(
            "Stats error",
            error
        );

    }

}

    async function scanWebsite(){


        if(!url){

            setError("Please enter website URL");

            return;

        }


        setError("");

        setResult(null);


        try{


            setLoading(true);


            const website = formatURL(url);



            const response = await API.get(

                "/full-scan",

                {

                    params:{

                        url:website

                    }

                }

            );



            setResult(response.data);


            // Refresh stats after a new scan so the cards stay in sync
            loadStats();



        }


        catch(error){


            console.log(error);


            setError(
                "Scan failed. Please check backend connection."
            );


        }


        finally{


            setLoading(false);


        }


    }



    function getRisk(score){


        if(score >= 80){

            return {

                text:"SAFE",

                color:"#22c55e",

                badge:"bg-green-500"

            };

        }


        if(score >=50){

            return {

                text:"WARNING",

                color:"#eab308",

                badge:"bg-yellow-500"

            };

        }


        return {

            text:"DANGEROUS",

            color:"#ef4444",

            badge:"bg-red-500"

        };


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



<div className="
max-w-6xl
mx-auto
p-8
">



<h1 className="
text-4xl
font-bold
mb-2
text-gray-900
dark:text-white
">

🛡️ CyberGuard AI Dashboard

</h1>



<p className="
text-gray-600
dark:text-gray-400
mb-8
">

AI-powered website security scanner

</p>



{/* STATS CARDS — compact, responsive: 2 cols on mobile, 4 on desktop */}


<div className="
grid
grid-cols-2
md:grid-cols-4
gap-3
mb-8
">


<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-4
text-center
transition-colors
">

<h3 className="text-xs font-bold text-gray-500 dark:text-gray-400">

📊 Total Scan

</h3>

<p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">

{stats.total}

</p>

</AnimatedCard>




<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-4
text-center
transition-colors
">

<h3 className="text-xs font-bold text-gray-500 dark:text-gray-400">

⭐ Average Score

</h3>

<p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">

{stats.average}%

</p>

</AnimatedCard>




<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-4
text-center
transition-colors
">

<h3 className="text-xs font-bold text-gray-500 dark:text-gray-400">

🟢 Safe

</h3>

<p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">

{stats.safe}

</p>

</AnimatedCard>




<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-4
text-center
transition-colors
">

<h3 className="text-xs font-bold text-gray-500 dark:text-gray-400">

🔴 High Risk

</h3>

<p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">

{stats.high}

</p>

</AnimatedCard>


</div>




{/* SCANNER */}


<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-6
mb-8
transition-colors
">


<div className="
flex
gap-3
">


<input


className="
flex-1
border
border-gray-300
dark:border-gray-600
dark:bg-gray-700
dark:text-white
dark:placeholder-gray-400
p-3
rounded-lg
"


placeholder="example.com"


value={url}


onChange={
(e)=>setUrl(e.target.value)
}


/>



<button


disabled={loading}


onClick={scanWebsite}


className="
bg-blue-600
hover:bg-blue-700
disabled:opacity-50
text-white
px-6
rounded-lg
font-bold
transition-colors
"


>


{

loading

?

"🔄 Scanning..."

:

"🚀 Scan Website"

}


</button>



</div>


</AnimatedCard>




{

error &&


<div className="
mt-5
mb-8
bg-red-100
dark:bg-red-950
text-red-700
dark:text-red-300
p-4
rounded-xl
">


⚠️ {error}


</div>


}




{/* LOADING STATE */}


{

loading &&

<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
mb-8
transition-colors
">

<LoadingScanner />

</AnimatedCard>

}




{/* RESULT — moved above stats cards */}


{

!loading && result &&


<div className="
space-y-6
mb-8
">



{/* SCORE CARD */}



<AnimatedCard className="
bg-white
dark:bg-gray-800
rounded-xl
shadow
p-8
text-center
transition-colors
">


<h2 className="
text-2xl
font-bold
text-gray-900
dark:text-white
">

Security Score

</h2>



<div className="
w-44
mx-auto
mt-6
">


<CircularProgressbar


value={
result.security_score || 0
}


text={
`${result.security_score || 0}%`
}


styles={

buildStyles({

textSize:"20px",

pathColor:

getRisk(
result.security_score || 0
).color,

textColor:

document.documentElement.classList.contains("dark")
?
"#ffffff"
:
"#1f2937",

trailColor:

document.documentElement.classList.contains("dark")
?
"#374151"
:
"#e5e7eb"

})

}


/>


</div>



<div className="mt-6">


<span

className={`
text-white
px-5
py-2
rounded-full
font-bold
${

getRisk(
result.security_score || 0
).badge

}
`}


>


{

getRisk(
result.security_score || 0
).text


}


</span>


</div>



<p className="
text-gray-500
dark:text-gray-300
mt-4
">

Overall Website Protection Level

</p>



<p className="
mt-5
text-gray-700
dark:text-gray-300
">


🌐 Website:

{" "}

{result.website}


</p>



</AnimatedCard>




{/* SECURITY CARDS */}



<div className="
grid
md:grid-cols-3
gap-5
">


<SecurityCard

icon="🔒"

title="HTTPS"

value={
result.https === "Enabled"
?
"Secure HTTPS Connection"
:
"HTTPS Not Enabled"
}

status={
result.https === "Enabled"
?
"Protected"
:
"Warning"
}

/>




<SecurityCard

icon="📜"

title="SSL Certificate"

value={
result.ssl?.status ||
"Unknown"
}

status={
result.ssl?.status
}

/>




<SecurityCard

icon="🛡️"

title="Security Headers"

value={

Object.keys(
result.headers || {}
).length

+

" Headers Checked"

}

/>


</div>




{/* AI ANALYSIS */}



<AnimatedCard className="
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
mb-3
text-gray-900
dark:text-white
">

🤖 AI Security Analysis

</h2>



<ul className="
list-disc
ml-5
text-gray-700
dark:text-gray-300
">


{

result.analysis?.length > 0

?

result.analysis.map(

(item,index)=>(


<li key={index}>

{item}

</li>


)

)


:

<li>

No analysis available

</li>


}



</ul>


</AnimatedCard>




{/* RECOMMENDATIONS */}



<AnimatedCard className="
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
mb-3
text-gray-900
dark:text-white
">

💡 Recommendations

</h2>




<ul className="
list-disc
ml-5
text-gray-700
dark:text-gray-300
">


{

result.recommendations?.length > 0

?

result.recommendations.map(

(item,index)=>(


<li key={index}>

{item}

</li>


)

)


:

<li>

No recommendation available

</li>


}



</ul>



</AnimatedCard>

<button

onClick={()=>downloadPDF(result)}

className="
bg-green-600
text-white
px-6
py-3
rounded-lg
font-bold
hover:bg-green-700
transition-colors
"

>

📄 Download Security Report

</button>


</div>


}





</div>


</div>


);


}


export default Dashboard;