import { doc, getDoc } from "firebase/firestore";

// HELPER FUNCTIONS
import { db } from "../utils/firebase/config";
import { Error, CheckForTimeout, SendResponse } from "../utils/express/Utils";

// TYPES
import { Request, Response } from 'express';

export default async function GetProjects(req: Request, res: Response) {
    const { UID } = req.query as { UID: string };

    if(!UID) {
        Error(res, 400, "Missing 'UID' Query Parameter");
        return;
    }
    
    try {
        const orgRef = doc(db, "proyectos", UID);
        const orgSnap = await getDoc(orgRef);

        if(!orgSnap.exists()) {
            Error(res, 404, `Organization '${UID}' not found in database`);
            return;
        }

        const { organizacion, ...projects } = orgSnap.data();

        if(!organizacion || !projects) {
            Error(res, 500, "Error parsing data from database");
            return;
        }

        const projectIds = Object.keys(projects).sort();
        const projectsArray = projectIds?.map(id => ({
            data: projects[id],
            id
        }));

        if(projectsArray.length === 0) {
            Error(res, 404, `No projects found in database for organization: ${organizacion}`);
            return;
        }

        SendResponse(res, 200, {
            organization: organizacion,
            projects: projectsArray,
        });
    } catch (err) {
        Error(res, 500, err);
    }
}
