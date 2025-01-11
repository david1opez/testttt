// TYPES
import { Response, Express } from 'express';

// Starts the server on the specified port, retrying with the next port if the current one is already in use
export function StartServer(app: Express, port: number) {
    const server = app.listen(port, () => {
        console.log('Server is running on port ' + port);
    })
    
    server.on('error', (err) => {
        if(err.message.includes("address already in use :::")) {
            server.close();
            console.log(`ERROR: Port ${port} is already in use. Trying port ${port + 1}`);
            StartServer(app, port + 1);
        }
        else {
            server.close();
            console.log(err.message);
            process.exit(1);
        }
    });

    server.on('request', (req, res) => {
        console.log(`Request from ${req.socket.remoteAddress} received: ${req.method} ${req.url}`);

        res.on('finish', () => {
            console.log(`Response sent: ${res.statusCode} ${res.statusMessage}`);
        });
    })
};

// Sends a response to the client checking if the headers were already sent
export function SendResponse(res: Response, status: number, message: any) {
    if(res.headersSent) {
        console.log("Trying to respond after headers were sent");
        return
    };

    res.status(status).send(message);
}

// Sends an error response to the client, logging the error message
export function Error(res: Response, statusCode: number, message: unknown, condition: boolean = true) {
    if(condition) {
        console.log(message);

        SendResponse(res, statusCode, {
            error: message
        });
    }
}

// Checks if the request has timed out, for setting different timeout values for different routes
export function CheckForTimeout(res: Response, timeout: number) {
    let executionTime = 0;
    let timeoutSent = false;

    const interval = setInterval(() => {
        executionTime += 100;

        if (executionTime > timeout && !timeoutSent) {
            timeoutSent = true;
            clearInterval(interval);

            Error(res, 408, "Request Timeout");
        }
    }, 100);
}
