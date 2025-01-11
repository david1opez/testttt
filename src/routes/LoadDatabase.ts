import { doc, setDoc } from 'firebase/firestore';

// HELPER FUNCTIONS
import { db } from '../utils/firebase/config';
import { SendResponse, Error } from '../utils/express/Utils';
import GenerateID from '../utils/GenerateID';
import { readSheet } from '../utils/google_sheets/GoogleSheets';

// TYPES
import { Request, Response } from 'express';

export default async function LoadDatabase(req: Request, res: Response) {
    const organizationUIDs: string[][] = await readSheet(process.env.SHEET_ID || "", "contraseñas", "A2:B");
    const data: string[][] = await readSheet(process.env.SHEET_ID || "", "alumnos", "A6:P");

    const projectsData: string[][] = [];
    const studentsData: string[][] = [];

    data.forEach((row) => {
        studentsData.push(row.slice(0, 9));
        projectsData.push(row.slice(7));
    });

    let projectsSet = new Set<string>();
    let organizationsNotFound = new Set<string>();

    projectsData.forEach((project) => {
        const found = organizationUIDs.find((organization) => organization[1] === project[0]);

        if(!found || !found[0]) {
            organizationsNotFound.add(
                JSON.stringify({
                    organization: project[0],
                    status: !found ? "Not found" : "No UID"
                })
            );
        }

        projectsSet.add(JSON.stringify(project));
    });

    if(organizationsNotFound.size > 0) {
        return Error(res, 404, {
                    message: `${organizationsNotFound.size} organization${organizationsNotFound.size > 1 ? "s" : ""} not found`,
                    organizations: Array.from(organizationsNotFound).map((organization) => JSON.parse(organization))
                });
    } else {
        let projectsArray: string[][] = Array.from(projectsSet).map((project) => JSON.parse(project));
        let projects: { [key: string]: { [key: string]: string[] | string}} = {};

        projectsArray.forEach((project) => {
            const projectID = GenerateID(`${project[0]}${project[1]}`);

            if(!projects[project[0]]) {
                projects[project[0]] = {
                    [projectID]: project.slice(1),
                    "organizacion": project[0],
                };
            } else {
                projects[project[0]][projectID] = project.slice(1);
            }
        });

        await Promise.all(Object.values(projects).map(async (project) => {
            const orgUID = (organizationUIDs.find((organization) => organization[1] === project["organizacion"]) || [undefined])[0];

            if(orgUID) {
                const orgRef = doc(db, "proyectos", orgUID);

                await setDoc(orgRef, project);
            }
        }));

        SendResponse(res, 200, {
            students: studentsData,
            projects: projects,
        });
    }
}
