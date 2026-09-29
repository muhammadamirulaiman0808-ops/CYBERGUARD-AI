import { useState } from "react";
import axios from "axios";


function FeedbackWidget(){


const [isOpen,setIsOpen] = useState(false);

const [rating,setRating] = useState(0);

const [hoverRating,setHoverRating] = useState(0);

const [comment,setComment] = useState("");

const [submitting,setSubmitting] = useState(false);

const [submitted,setSubmitted] = useState(false);



function resetAndClose(){

setIsOpen(false);

setTimeout(()=>{

setRating(0);

setComment("");

setSubmitted(false);

},300);

}



async function submitFeedback(){


if(rating === 0){

alert("Please select a rating first");

return;

}


try{

setSubmitting(true);


const username = localStorage.getItem("username");


await axios.post(

"http://127.0.0.1:8000/feedback",

{

username: username || null,

rating: rating,

comment: comment

}

);


setSubmitted(true);


}

catch(err){

console.log(err);

alert("Failed to send feedback. Please try again.");

}

finally{

setSubmitting(false);

}


}




return(

<>


{/* FLOATING BUTTON */}


<button

onClick={()=>setIsOpen(true)}

className="
fixed
bottom-6
right-6
bg-blue-600
hover:bg-blue-700
text-white
rounded-full
w-14
h-14
shadow-lg
flex
items-center
justify-center
text-2xl
transition-colors
z-40
"

title="Give Feedback"

>

💬

</button>




{/* MODAL */}


{

isOpen &&


<div

onClick={resetAndClose}

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
max-w-md
w-full
p-6
transition-colors
"

>


{

submitted ?


<div className="text-center py-6">


<p className="text-4xl mb-3">🎉</p>


<h2 className="
text-xl
font-bold
text-gray-900
dark:text-white
mb-2
">

Thank you!

</h2>


<p className="
text-gray-600
dark:text-gray-400
mb-6
">

Your feedback means a lot to us.

</p>


<button

onClick={resetAndClose}

className="
bg-blue-600
hover:bg-blue-700
text-white
px-6
py-2
rounded-lg
font-bold
transition-colors
"

>

Close

</button>


</div>


:


<>


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

💬 Give Feedback

</h2>


<button

onClick={resetAndClose}

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




<p className="
text-gray-600
dark:text-gray-400
mb-4
text-sm
">

How was your experience using CyberGuard AI?

</p>




{/* STAR RATING */}


<div className="
flex
justify-center
gap-2
mb-5
">


{

[1,2,3,4,5].map((star)=>(


<button

key={star}

onClick={()=>setRating(star)}

onMouseEnter={()=>setHoverRating(star)}

onMouseLeave={()=>setHoverRating(0)}

className="text-3xl transition-transform hover:scale-110"

>

{

star <= (hoverRating || rating)

?

"⭐"

:

"☆"

}

</button>


))

}


</div>




{/* COMMENT */}


<textarea

value={comment}

onChange={(e)=>setComment(e.target.value)}

placeholder="Tell us about your experience (optional)..."

rows={4}

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
mb-4
resize-none
"

>

</textarea>




<button

onClick={submitFeedback}

disabled={submitting}

className="
w-full
bg-blue-600
hover:bg-blue-700
disabled:opacity-50
text-white
py-3
rounded-lg
font-bold
transition-colors
"

>

{

submitting

?

"Submitting..."

:

"Submit Feedback"

}

</button>



</>

}



</div>


</div>


}


</>

);


}


export default FeedbackWidget;