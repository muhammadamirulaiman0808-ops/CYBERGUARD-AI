import { motion } from "framer-motion";


function AnimatedCard({children, className=""}){


    return(

        <motion.div

        initial={{
            opacity:0,
            y:20
        }}

        animate={{
            opacity:1,
            y:0
        }}

        transition={{
            duration:0.5
        }}

        className={className}

        >

            {children}

        </motion.div>

    );


}


export default AnimatedCard;