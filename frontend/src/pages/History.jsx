import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Navbar from "../components/Navbar";
import { downloadPDF } from "../utils/pdfReport";


function History(){


const navigate = useNavigate();

const [history,setHistory] = useState([]);

const [loading,setLoading] = useState(true);

const [deletingId,setDeletingId] = useState(null);

const [search,setSearch] = useState("");

const [viewingResult,setViewingResult] = useState(null);



useEffect(()=>{


fetchHistory();


},[]);



async function fetchHistory(){


try{

setLoading(true);

const res = await API.get(
"/history"
);


setHistory(res.data);



}

catch(err){


console.log(err);


}

finally{


setLoading(false);


}



}



async function deleteOne(id){


if(!window.confirm(
"Delete this scan record?"
)){

return;

}


try{

setDeletingId(id);

await API.delete(
`/history/${id}`
);

setHistory(

history.filter(
(item)=>item.id !== id
)

);


}

catch(err){

console.log(err);

alert(
"Failed to delete scan"
);

}

finally{

setDeletingId(null);

}


}



async function deleteAll(){


if(history.length === 0){

return;

}


if(!window.confirm(
"Delete ALL scan history? This cannot be undone."
)){

return;

}


try{

await API.delete(
"/history"
);

setHistory([]);


}

catch(err){

console.log(err);

alert(
"Failed to clear history"
);

}


}



function viewResult(item){


if(!item.details){

alert(
"No detailed data available for this scan (older record)."
);

return;

}


try{

const parsed = JSON.parse(item.details);

setViewingResult(parsed);

}

catch(err){

console.log(err);

alert(
"Failed to load scan details."
);

}


}



// Filter history by website name based on search input
const filteredHistory = history.filter(
(item)=>

item.website

.toLowerCase()

.includes(

search.toLowerCase()

)

);



function getRisk(score){


if(score >= 80){

return { text:"SAFE", badge:"bg-green-500" };

}

if(score >= 50){

return { text:"WARNING", badge:"bg-yellow-500" };

}

return { text:"DANGEROUS", badge:"bg-red-500" };


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



<div className="max-w-6xl mx-auto p-8">



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




<div className="
flex
justify-between
items-center
mb-6
flex-wrap
gap-3
">


<h1 className="
text-3xl
font-bold
text-gray-900
dark:text-white
">

📜 Scan History

</h1>




{

history.length > 0 &&


<button

onClick={deleteAll}

className="
bg-red-600
hover:bg-red-700
text-white
px-4
py-2
rounded-lg
font-bold
transition-colors
"

>

🗑️ Clear All

</button>


}


</div>




{/* SEARCH BAR */}


{

history.length > 0 &&


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
mb-6
"


placeholder="🔍 Search by website..."


value={search}


onChange={
(e)=>setSearch(e.target.value)
}


/>


}




{

loading ?

<p className="text-gray-700 dark:text-gray-300">Loading...</p>


:


history.length === 0 ?

<div className="
bg-white
dark:bg-gray-800
p-6
rounded-xl
shadow
text-gray-700
dark:text-gray-300
transition-colors
">

No scan history

</div>


:

filteredHistory.length === 0 ?

<div className="
bg-white
dark:bg-gray-800
p-6
rounded-xl
shadow
text-gray-700
dark:text-gray-300
transition-colors
">

No results for "{search}"

</div>


:


<div className="space-y-4">


{

filteredHistory.map((item)=>(


<div

key={item.id}

className="
bg-white
dark:bg-gray-800
shadow
rounded-xl
p-5
flex
justify-between
items-center
transition-colors
"


>


<div>

<h2 className="
font-bold
text-lg
text-gray-900
dark:text-white
">

{item.website}

</h2>


<p className="
text-gray-500
dark:text-gray-400
">

{item.date}

</p>


</div>




<div className="
flex
items-center
gap-4
">


<div className="font-bold text-blue-600 dark:text-blue-400">

{item.score}%

</div>



<button

onClick={()=>viewResult(item)}

className="
text-gray-500
hover:text-blue-600
dark:text-gray-400
dark:hover:text-blue-400
transition-colors
"

title="View full result"

>

📄

</button>



<button

onClick={()=>deleteOne(item.id)}

disabled={deletingId === item.id}

className="
text-red-500
hover:text-red-700
disabled:opacity-50
transition-colors
"

title="Delete this scan"

>

{

deletingId === item.id

?

"..."

:

"🗑️"

}

</button>


</div>



</div>


))


}


</div>


}



</div>




{/* VIEW RESULT MODAL */}


{

viewingResult &&


<div

onClick={()=>setViewingResult(null)}

className="
fixed
inset-0
bg-black/50
flex
items-center
justify-center
p-4
z-50
"

>


<div

onClick={(e)=>e.stopPropagation()}

className="
bg-white
dark:bg-gray-800
rounded-xl
shadow-xl
max-w-2xl
w-full
max-h-[85vh]
overflow-y-auto
p-6
transition-colors
"

>


<div className="
flex
justify-between
items-center
mb-4
">


<h2 className="
text-xl
font-bold
text-gray-900
dark:text-white
">

📄 Scan Result — {viewingResult.website}

</h2>



<button

onClick={()=>setViewingResult(null)}

className="
text-gray-500
hover:text-red-500
text-2xl
leading-none
"

>

×

</button>


</div>




{/* SCORE */}


<div className="
text-center
mb-6
">


<p className="text-4xl font-bold text-gray-900 dark:text-white">

{viewingResult.security_score}%

</p>


<span

className={`
inline-block
mt-2
text-white
px-4
py-1
rounded-full
font-bold
text-sm
${getRisk(viewingResult.security_score).badge}
`}

>

{getRisk(viewingResult.security_score).text}

</span>


</div>




{/* SECURITY SUMMARY */}


<div className="
grid
grid-cols-3
gap-3
mb-6
text-center
">


<div className="
bg-gray-100
dark:bg-gray-700
rounded-lg
p-3
">

<p className="text-xs text-gray-500 dark:text-gray-400 font-bold">

🔒 HTTPS

</p>

<p className="text-sm mt-1 text-gray-900 dark:text-white">

{

viewingResult.https === "Enabled"

?

"Enabled"

:

"Not Secure"

}

</p>

</div>



<div className="
bg-gray-100
dark:bg-gray-700
rounded-lg
p-3
">

<p className="text-xs text-gray-500 dark:text-gray-400 font-bold">

📜 SSL

</p>

<p className="text-sm mt-1 text-gray-900 dark:text-white">

{viewingResult.ssl?.status || "Unknown"}

</p>

</div>



<div className="
bg-gray-100
dark:bg-gray-700
rounded-lg
p-3
">

<p className="text-xs text-gray-500 dark:text-gray-400 font-bold">

🛡 Headers

</p>

<p className="text-sm mt-1 text-gray-900 dark:text-white">

{Object.keys(viewingResult.headers || {}).length} Checked

</p>

</div>


</div>




{/* ANALYSIS */}


<div className="mb-6">


<h3 className="
font-bold
mb-2
text-gray-900
dark:text-white
">

🤖 AI Security Analysis

</h3>


<ul className="
list-disc
ml-5
text-sm
text-gray-700
dark:text-gray-300
space-y-1
">


{

viewingResult.analysis?.length > 0

?

viewingResult.analysis.map(

(item,index)=>(

<li key={index}>{item}</li>

)

)

:

<li>No analysis available</li>

}


</ul>


</div>




{/* RECOMMENDATIONS */}


<div className="mb-6">


<h3 className="
font-bold
mb-2
text-gray-900
dark:text-white
">

💡 Recommendations

</h3>


<ul className="
list-disc
ml-5
text-sm
text-gray-700
dark:text-gray-300
space-y-1
">


{

viewingResult.recommendations?.length > 0

?

viewingResult.recommendations.map(

(item,index)=>(

<li key={index}>{item}</li>

)

)

:

<li>No recommendation available</li>

}


</ul>


</div>




<button

onClick={()=>downloadPDF(viewingResult)}

className="
w-full
bg-green-600
hover:bg-green-700
text-white
py-3
rounded-lg
font-bold
transition-colors
"

>

📄 Download Security Report

</button>



</div>


</div>


}



</div>


);


}


export default History;