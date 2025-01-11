import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// HELPER FUNCTIONS
import { readSheet, updateSheet } from '../utils/google_sheets/GoogleSheets';
import { auth } from '../utils/firebase/config';
import { Error } from '../utils/express/Utils';
import GetEmail from '../utils/GetEmail';

// TYPES
import { Request, Response } from 'express';

type AccessStatus = ["TRUE"] | ["FALSE"] | [undefined];
type FailedOrg = {
    organization: string,
    password: string,
    error: string
}

export default async function CreateUsers(req: Request, res: Response) {
    const timeout = 8000;
    let executionTime = 0;
    let timeoutReached = false;

    const interval = setInterval(() => {
        executionTime += 100;

        if (executionTime > timeout && !timeoutReached) {
            timeoutReached = true;
            clearInterval(interval);
        }
    }, 100);

    try {
        const organizations = await readSheet(process.env.SHEET_ID as string, "contraseñas", "A2:D");
        
        let statuses: AccessStatus[] = [];
        let UIDs: [string][] = [];

        let failed: FailedOrg[] = [];
        let newUsers = 0;

        let i = 0;

        for (i; i < organizations.length; i++) {
            const [uid, name, password, canAccess] = organizations[i] as [string, string, string, "TRUE" | "FALSE" | undefined];

            UIDs.push([uid]);
            statuses.push([canAccess]);

            if(canAccess == undefined || canAccess == "FALSE") {
                const email = GetEmail(name);

                try {
                    const user = await createUserWithEmailAndPassword(auth, email, password);

                    if(user.user) {
                        statuses[i] = ["TRUE"];
                        UIDs[i] = [user.user.uid];
                        newUsers++;
                    }

                    console.log(`Created user for ${name}`);
                } catch (error: any) {                    
                    if(error.code == "auth/email-already-in-use") {
                        const namesFound = organizations.filter(org => GetEmail(org[1]) == GetEmail(name));

                        if(namesFound.length == 1 || namesFound[0][1] == name) {
                            if(uid) {
                                UIDs[i] = [uid];
                                statuses[i] = ["TRUE"];
                            }
                            else {
                                try {
                                    const user = await signInWithEmailAndPassword(auth, email, password);

                                    UIDs[i] = [user.user.uid];
                                    statuses[i] = ["TRUE"];

                                    console.log(`Updating UID for ${name}`);
                                }
                                catch(error: any) {
                                    failed.push({
                                        organization: name,
                                        password: password,
                                        error: error.code
                                    });

                                    statuses[i] = ["FALSE"];

                                    console.log(error.code);
                                }
                            }
                        }
                        else {
                            failed.push({
                                organization: name,
                                password: password,
                                error: error.code
                            });

                            console.log(error.code);
                        }
                    }
                    else if(error.code == "auth/too-many-requests") {
                        console.log("Reached Firebase Auth API limit. Terminating...");
                        break;
                    } else {
                        console.log(error.code);
                    }

                }
            }

            if(timeoutReached) {
                break;
            }
        }

        const statusesRange = `D2:D${organizations?.length + 1}`
        const UIDsRange = `A2:A${i + 2}`;

        await updateSheet(process.env.SHEET_ID as string, "contraseñas", statusesRange, statuses);
        await updateSheet(process.env.SHEET_ID as string, "contraseñas", UIDsRange, UIDs);

        let statusCode = 304; // Not Modified
        
        if(timeoutReached) {
            statusCode = 408;
        }
        else {
            if(failed?.length > 0 && newUsers == 0) {
                statusCode = 500;
            } else if(newUsers > 0) {
                if(failed.length > 0) {
                    statusCode = 206; // Partial Content
                } else {
                    statusCode = 201;
                }
            }
        }

        if(statusCode == 500) {
            Error(res, 500, {
                message: "Failed to create any new users",
                failedOrgs: {
                    count: failed.length,
                    orgs: failed
                }
            });
        }
        else {
            res.status(statusCode).send({
                newlyRegisteredOrgs: newUsers,
                totalOrgs: organizations.length,
                failedOrgs: {
                    count: failed.length,
                    orgs: failed
                }
            });
        }
    }
    catch (error) {
        Error(res, 500, error);
    }
}
