import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// HELPER FUNCTIONS
import { StartServer } from './utils/express/Utils';
import { TimeoutMiddleware } from './utils/express/Middleware';
// ROUTES
import * as Routes from './routes/ExportRoutes';

const app = express();
const router = express.Router();

// ROUTES HANDLING
router.get('/getProjects', Routes.GetProjects);
router.get('/getStudents', Routes.GetStudents);
router.post('/updateStudents', Routes.UpdateStudents);

router.post('/createUsers', Routes.CreateUsers);
router.post('/loadDatabase', Routes.LoadDatabase);

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use('/', router);

// INITIALIZE SERVER
StartServer(app, 3000);
