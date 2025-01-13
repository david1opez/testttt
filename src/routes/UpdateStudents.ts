import { doc, updateDoc } from "firebase/firestore";

// HELPER FUNCTIONS
import { updateSheet } from "../utils/google_sheets/GoogleSheets";
import { db } from "../utils/firebase/config";
import { Error, SendResponse } from "../utils/express/Utils";

// TYPES
import { Request, Response } from 'express';

export default async function UpdateStudents(req: Request, res: Response) {    
    const { projectID } = req.query as { projectID: string };
    const { students } = req.body as { students: {data: (string|number|boolean)[], row: number }[] };

    if(!students) {
        Error(res, 400, "Missing 'students' Body Parameter");
        return;
    }

    try {
        let studentsObj: {[key: string]: {data: (string|number|boolean)[], row: number}} = {};

        let ranges: {students: (string|number|boolean)[][], range: [number, number]}[] = [];

        let duplicatedStudents: string[] = [];

        students.map((student) => {
            if(studentsObj[student.data[0] as string]) {
                duplicatedStudents.push(student.data[0] as string);
                return;
            };

            studentsObj[student.data[0] as string] = {
                data: student.data,
                row: student.row
            }

            if(ranges.length === 0) {
                ranges.push({
                    students: [student.data],
                    range: [student.row, student.row]
                });
            } else {
                const lastIdx = ranges.length - 1;

                if(student.row-1 === ranges[lastIdx].range[1]) {
                    ranges[lastIdx].range[1] = student.row;
                    ranges[lastIdx].students.push(student.data);
                } else {
                    ranges.push({
                        students: [student.data],
                        range: [student.row, student.row]
                    });
                }
            }
        });

        await Promise.all(ranges.map(async (range) => {
            console.log(`Updating range A${range.range[0]}:G${range.range[1]}`);

            await updateSheet(
                process.env.SHEET_ID || "", "alumnos",
                `A${range.range[0]}:G${range.range[1]}`,
                range.students
            );
        }));

        const studentsRef = doc(db, "alumnos", projectID);

        await updateDoc(studentsRef, studentsObj)
        .catch((err) => {
            if(err.code === "not-found") {
                Error(res, 404, "Project Not Found");
                return;
            }
        });

        const updatedStudents = students.map((student) => student.data[0]);

        if(duplicatedStudents.length > 0) {
            Error(res, 409, {
                message: "Failed to update some students with duplicated IDs",
                duplicatedStudents
            });
            return;
        }
        SendResponse(res, 200, { updatedStudents });
    }
    catch (err) {
        Error(res, 500, err);
    }
}
