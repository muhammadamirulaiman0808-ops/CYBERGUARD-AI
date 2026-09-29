import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export function downloadPDF(result){


    const doc = new jsPDF();


    const date = new Date().toLocaleString();



    doc.setFontSize(20);

    doc.text(
        "CyberGuard AI Security Report",
        20,
        20
    );



    doc.setFontSize(12);


    doc.text(
        `Website: ${result.website}`,
        20,
        40
    );


    doc.text(
        `Scan Date: ${date}`,
        20,
        50
    );


    doc.text(
        `Security Score: ${result.security_score}%`,
        20,
        60
    );



    let risk = "HIGH";

if(result.security_score >= 80){

    risk = "LOW";

}
else if(result.security_score >= 50){

    risk = "MEDIUM";

}


doc.text(
    `Risk Level: ${risk}`,
    20,
    70
);



    // Security Status Table

    autoTable(doc, {

        startY: 85,

        head:[
            [
                "Security Check",
                "Status"
            ]
        ],

        body:[

            [
                "HTTPS",
                result.https === "Enabled"
                ?
                "Enabled"
                :
                "Not Secure"
            ],

            [
                "SSL Certificate",
                result.ssl?.status || "Unknown"
            ],

            [
                "Headers Checked",
                Object.keys(
                    result.headers || {}
                ).length
            ]

        ]

    });



    let y = doc.lastAutoTable.finalY + 20;



    // AI Analysis

    doc.setFontSize(14);

    doc.text(
        "AI Security Analysis",
        20,
        y
    );


    y += 10;


    doc.setFontSize(11);


    result.analysis?.forEach(
        (item)=>{

            doc.text(
                `• ${item}`,
                25,
                y
            );

            y += 8;

        }
    );



    y += 10;



    // Recommendations

    doc.setFontSize(14);

    doc.text(
        "Recommendations",
        20,
        y
    );


    y += 10;


    doc.setFontSize(11);


    result.recommendations?.forEach(
        (item)=>{

            doc.text(
                `• ${item}`,
                25,
                y
            );

            y += 8;

        }
    );



    doc.save(
        "CyberGuard_AI_Report.pdf"
    );


}