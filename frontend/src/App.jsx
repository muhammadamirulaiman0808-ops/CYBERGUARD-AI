import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Profile from "./components/Profile";


import ProtectedRoute from "./components/ProtectedRoute";
import FeedbackWidget from "./components/FeedbackWidget";





function App(){


return(


<BrowserRouter>


<Routes>





{/* PUBLIC */}



<Route

path="/"

element={<Home />}

/>





<Route

path="/login"

element={<Login />}

/>





<Route

path="/register"

element={<Register />}

/>








{/* PROTECTED */}




<Route


path="/dashboard"


element={


<ProtectedRoute>


<Dashboard />


</ProtectedRoute>


}


/>







<Route


path="/history"


element={


<ProtectedRoute>


<History />


</ProtectedRoute>


}


/>




<Route


path="/profile"


element={


<ProtectedRoute>


<Profile />


</ProtectedRoute>


}


/>





</Routes>



{/* Appears on every page */}


<FeedbackWidget />



</BrowserRouter>


);


}



export default App;