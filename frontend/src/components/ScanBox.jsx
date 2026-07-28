import { useState } from "react"
import axios from "axios"

import SecurityCard from "./SecurityCard"
import AIAnalysis from "./AIAnalysis"


function ScanBox(){

    const [url,setUrl] = useState("")

    const [result,setResult] = useState(null)

    const [loading,setLoading] = useState(false)



    async function scan(){


        try{

            setLoading(true)

            setResult(null)


            const response = await axios.get(

                "http://127.0.0.1:8000/full-scan",

                {
                    params:{
                        url:url
                    }
                }

            )


            setResult(response.data)


        }


        catch(error){

            console.log(error)

            alert("Scan failed")

        }


        finally{

            setLoading(false)

        }


    }



    return (

        <div className="mt-10 flex flex-col items-center">


            {/* URL INPUT */}

            <div>


                <input

                    className="
                    w-96
                    p-4
                    border
                    rounded-lg
                    "

                    placeholder="https://example.com"

                    value={url}

                    onChange={
                        (e)=>setUrl(e.target.value)
                    }

                />


                <button

                    onClick={scan}

                    className="
                    ml-3
                    px-6
                    py-4
                    rounded-lg
                    bg-black
                    text-white
                    "

                >

                    {
                        loading
                        ?
                        "Scanning..."
                        :
                        "Scan Website"
                    }


                </button>


            </div>



            {/* SECURITY RESULT */}


            {
                result && (


                    <div className="
                    mt-12
                    w-full
                    max-w-xl
                    ">


                        <h2 className="
                        text-3xl
                        font-bold
                        text-center
                        mb-6
                        ">

                            Security Report

                        </h2>



                        <div className="
                        grid
                        grid-cols-2
                        gap-4
                        ">



                            <SecurityCard

                                title="Security Score"

                                value={
                                    result.security_score + "/100"
                                }

                            />



                            <SecurityCard

                                title="HTTPS"

                                value={
                                    result.https
                                    ?
                                    "✅ Secure"
                                    :
                                    "❌ Unsafe"
                                }

                            />



                            <SecurityCard

                                title="SSL"

                                value={
                                    result.ssl.status
                                }

                            />



                            <SecurityCard

                                title="Website"

                                value={
                                    result.website
                                }

                            />


                        </div>



                        {/* AI REPORT */}


                        <AIAnalysis

                            data={
                                result.ai_analysis
                            }

                        />


                    </div>


                )

            }



        </div>

    )

}


export default ScanBox