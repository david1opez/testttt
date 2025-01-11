import { doc, updateDoc } from "firebase/firestore";

// HELPER FUNCTIONS
import { db } from "../utils/firebase/config";
import { Error, CheckForTimeout, SendResponse } from "../utils/express/Utils";

// TYPES
import { Request, Response } from 'express';

export default async function UpdateStudents(req: Request, res: Response) {
    CheckForTimeout(res, 10000);
    
    const { projectID } = req.query as { projectID: string };
    const { students } = req.body as { students: (string|number|boolean)[][] };

    if(!students) {
        Error(res, 400, "Missing 'students' Body Parameter");
        return;
    }

    try {
        let studentsObj: {[key: string]: (string|number|boolean)[]} = {};

        students.forEach((student) => {
            studentsObj[student[0] as string] = student
        });

        const studentsRef = doc(db, "alumnos", projectID);

        await updateDoc(studentsRef, studentsObj)
        .catch((err) => {
            if(err.code === "not-found") {
                Error(res, 404, "Project Not Found");
                return;
            }
        });

        const updatedStudents = students.map((student) => student[0]);

        SendResponse(res, 200, { updatedStudents });
    }
    catch (err) {
        Error(res, 500, err);
    }
}
