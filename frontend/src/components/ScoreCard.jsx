function ScoreCard({score}){


function getColor(){

    if(score >= 80)
        return "text-green-600";

    if(score >= 50)
        return "text-yellow-600";

    return "text-red-600";

}



return(

<div className="bg-white shadow rounded-xl p-6">


<h2 className="text-xl font-bold">

Security Score

</h2>



<div className={

"text-6xl font-bold mt-4 "

+ getColor()

}>


{score}/100


</div>



<div className="w-full bg-gray-200 rounded-full h-4 mt-5">


<div

className="bg-blue-600 h-4 rounded-full"

style={{

width:`${score}%`

}}

/>


</div>


</div>


)


}


export default ScoreCard;