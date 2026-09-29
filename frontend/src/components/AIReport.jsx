function AIReport({analysis, recommendations}){


return(

<div className="bg-white shadow-lg rounded-xl p-6 mt-6">


<h2 className="text-2xl font-bold mb-5">

🤖 AI Security Report

</h2>



<div className="mb-6">


<h3 className="text-lg font-bold mb-2">

📊 Analysis

</h3>


<p className="text-gray-700 whitespace-pre-line">

{

analysis ||

"No analysis available"

}

</p>


</div>





<div>


<h3 className="text-lg font-bold mb-3">

🔧 Recommendations

</h3>



{

recommendations && recommendations.length > 0 ?


<ul className="space-y-2">


{

recommendations.map((item,index)=>(


<li

key={index}

className="bg-gray-100 p-3 rounded-lg"

>


✅ {item}


</li>


))


}


</ul>


:


<p className="text-gray-500">

No recommendation available.

</p>


}



</div>



</div>


)


}


export default AIReport;