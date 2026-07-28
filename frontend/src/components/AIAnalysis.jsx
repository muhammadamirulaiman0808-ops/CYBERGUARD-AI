function AIAnalysis({data}){


return (

<div className="
mt-8
border
rounded-xl
p-6
bg-white
shadow
">


<h2 className="
text-2xl
font-bold
">

🤖 AI Security Analysis

</h2>



<div className="mt-4">


<p className="
font-bold
">

Risk Level:

</p>


<p>

{data.risk_level}

</p>


</div>




<div className="mt-4">


<p className="font-bold">

Summary:

</p>


<p>

{data.summary}

</p>


</div>





<div className="mt-4">


<p className="font-bold">

Detected Issues:

</p>


<ul>


{
data.issues.map(
(issue,index)=>(

<li key={index}>

⚠ {issue}

</li>

)
)

}


</ul>


</div>





<div className="mt-4">


<p className="font-bold">

Recommendations:

</p>


<ul>


{
data.recommendations.map(

(item,index)=>(

<li key={index}>

✅ {item}

</li>

)

)

}


</ul>


</div>



</div>


)

}


export default AIAnalysis