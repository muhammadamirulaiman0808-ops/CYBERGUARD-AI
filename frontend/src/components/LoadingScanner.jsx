function LoadingScanner(){

return(

<div className="
flex
flex-col
items-center
justify-center
py-8
">


<div className="
w-16
h-16
border-4
border-blue-500
border-t-transparent
rounded-full
animate-spin
mb-5
">
</div>




<h2 className="
text-xl
font-bold
dark:text-white
mb-4
">

🔍 Scanning Website...

</h2>





<div className="
space-y-2
text-gray-600
dark:text-gray-300
text-center
">


<p>
✅ Checking HTTPS Security
</p>


<p>
🔐 Validating SSL Certificate
</p>


<p>
🛡 Checking Security Headers
</p>


<p>
🤖 Generating AI Recommendation
</p>


</div>



</div>


);


}


export default LoadingScanner;