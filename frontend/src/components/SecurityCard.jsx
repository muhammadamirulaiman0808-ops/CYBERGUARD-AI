function SecurityCard({title, value}){


    return (

        <div
        className="
        border
        rounded-xl
        p-5
        shadow
        bg-white
        "
        >

            <h3 className="
            text-gray-500
            text-sm
            ">
                {title}
            </h3>


            <p className="
            text-xl
            font-bold
            mt-2
            ">
                {value}
            </p>


        </div>

    )

}


export default SecurityCard