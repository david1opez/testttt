import { doc, getDoc } from "firebase/firestore";

// HELPER FUNCTIONS
import { db } from "../utils/firebase/config";
import { Error, CheckForTimeout, SendResponse } from "../utils/express/Utils";

// TYPES
import { Request, Response } from 'express';

export default async function GetStudents(req: Request, res: Response) {
    CheckForTimeout(res, 10000);
    
    const { projectID } = req.query as { projectID: string };

    if(!projectID) {
        Error(res, 400, "Missing 'projectID' Query Parameter");
        return;
    }
    
    try {
        const studentsRef = doc(db, "alumnos", projectID);
        const studentsSnap = await getDoc(studentsRef);

        if(!studentsSnap.exists()) {
            Error(res, 404, `Project '${projectID}' not found in students database`);
            return;
        }

        const { ...students } = studentsSnap.data();

        if(!students) {
            Error(res, 500, "Error parsing data from database");
            return;
        }

        const studentIds = Object.keys(students).sort();
        const studentsArray = studentIds?.map(matricula => ([matricula, ...students[matricula]]));

        if(studentsArray.length === 0) {
            Error(res, 404, `No students found in database for organization: ${projectID}`);
            return;
        }

        SendResponse(res, 200, {
            students: studentsArray,
        });
    } catch (err) {
        Error(res, 500, err);
    }
}
