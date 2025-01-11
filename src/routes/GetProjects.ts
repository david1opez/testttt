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
        const orgRef = doc(db, "organizaciones", UID);
        const orgSnap = await getDoc(orgRef);

        if(!orgSnap.exists()) {
            Error(res, 404, `Organization '${UID}' not found in database`);
            return;
        }

        const databaseID = orgSnap.data()?.proyectosID;

        const projectRef = doc(db, "proyectos", databaseID);
        const projectSnap = await getDoc(projectRef);

        if(!projectSnap.exists()) {
            Error(res, 404, `Project '${databaseID}' not found in database`);
            return;
        }

        const { organizacion, ...projects } = projectSnap.data();

        if(!organizacion || !projects) {
            Error(res, 500, "Error parsing data from database");
            return;
        }

        const projectIds = Object.keys(projects).sort();
        const projectsArray = projectIds?.map(id => projects[id]);

        if(projectsArray.length === 0) {
            Error(res, 404, `No projects found in database for organization: ${organizacion}`);
            return;
        }

        SendResponse(res, 200, {
            organization: organizacion,
            projects: projectsArray,
            projectIds
        });
    } catch (err) {
        Error(res, 500, err);
    }
}
