import Navbar from "./components/Navbar"
import ScanBox from "./components/ScanBox"


function App(){


return (

<div className="
min-h-screen
bg-gray-100
">


<Navbar/>


<main className="
flex
flex-col
items-center
mt-20
">


<h1 className="
text-6xl
font-bold
text-center
">

CyberGuard AI

</h1>



<p className="
mt-5
text-xl
">

AI Website Security Scanner

</p>



<ScanBox/>


</main>


</div>


)


}


export default App