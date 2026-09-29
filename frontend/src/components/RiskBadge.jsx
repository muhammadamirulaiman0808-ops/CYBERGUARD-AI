function RiskBadge({score}){


let risk;

let style;



if(score >=80){

risk="LOW";

style="bg-green-500";

}

else if(score>=50){

risk="MEDIUM";

style="bg-yellow-500";

}

else{

risk="HIGH";

style="bg-red-500";

}




return(

<span

className={

`${style} text-white px-4 py-2 rounded-full font-bold`

}

>

{risk}

</span>


)


}


export default RiskBadge;