import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";


function History(){


    const [history,setHistory] = useState([]);

    const [loading,setLoading] = useState(true);

    const [search,setSearch] = useState("");

    const [filter,setFilter] = useState("ALL");



    useEffect(()=>{

        fetchHistory();

    },[]);





    async function fetchHistory(){


        try{


            const response = await API.get(
                "/history"
            );


            setHistory(
                response.data
            );


        }


        catch(error){


            console.log(
                error
            );


        }


        finally{


            setLoading(false);


        }


    }






    const filteredHistory = history.filter(
        
        (item)=>{


            const website =
            item.website
            .toLowerCase()
            .includes(
                search.toLowerCase()
            );



            const risk =
            filter === "ALL"
            ||
            item.risk.toUpperCase()
            ===
            filter;



            return website && risk;


        }

    );







    function riskStyle(risk){


        if(
            risk.toLowerCase()
            === "low"
        ){

            return "bg-green-500";


        }


        if(
            risk.toLowerCase()
            === "medium"
        ){

            return "bg-yellow-500";


        }


        return "bg-red-500";


    }








return(


<div className="
min-h-screen
bg-gray-100
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
">

📜 Scan History

</h1>



<p className="
text-gray-600
mb-8
">

Previous website security scans

</p>






{/* SEARCH FILTER */}


<div className="
bg-white
rounded-xl
shadow
p-5
mb-6
flex
gap-3
">


<input


className="
border
p-3
rounded-lg
flex-1
"


placeholder="Search website..."


value={search}


onChange={
(e)=>setSearch(e.target.value)
}


/>





<select


className="
border
p-3
rounded-lg
"


value={filter}


onChange={
(e)=>setFilter(e.target.value)
}


>


<option value="ALL">

All Risk

</option>


<option value="LOW">

Low

</option>


<option value="MEDIUM">

Medium

</option>


<option value="HIGH">

High

</option>


</select>



</div>









{

loading &&


<div className="
text-center
">

Loading history...

</div>


}







{

!loading && filteredHistory.length === 0 &&


<div className="
bg-white
rounded-xl
shadow
p-6
text-center
">

No scan history found

</div>


}









<div className="
space-y-5
">



{

filteredHistory.map(


(item,index)=>(



<div

key={index}

className="
bg-white
rounded-xl
shadow
p-6
"


>


<div className="
flex
justify-between
items-center
"


>


<div>


<h2 className="
text-xl
font-bold
">

🌐 {item.website}

</h2>


<p className="
text-gray-500
mt-2
">

📅 {item.date}

</p>


</div>





<div>


<span

className={`

text-white
px-4
py-2
rounded-full
font-bold

${

riskStyle(item.risk)

}

`}

>

{

item.risk

}


</span>


</div>



</div>







<div className="
mt-5
text-lg
">

Security Score:

<span className="
font-bold
">

{item.score}%

</span>


</div>





</div>



)


)



}



</div>





</div>


</div>


);


}


export default History;