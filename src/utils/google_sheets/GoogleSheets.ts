import { google, sheets_v4 } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export async function getGoogleSheetClient(): Promise<sheets_v4.Sheets> {
  const serviceAccountCredentials = {
    "type": "service_account",
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key": process.env.PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": process.env.AUTH_URI,
    "token_uri": process.env.TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
    "universe_domain": process.env.UNIVERSE_DOMAIN
  };

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({
    version: "v4",
    auth: auth,
  });
}

export async function readSheet(sheetId: string, tabName: string, range: string) {
  const googleSheetClient = await getGoogleSheetClient();
  
  const res = await googleSheetClient.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
  });
    
  return res.data.values || [];
}
  
export async function writeSheet(sheetId: string, tabName: string, range: string, data: any) {
  const googleSheetClient = await getGoogleSheetClient();
  
  await googleSheetClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      majorDimension: "ROWS",
      values: data
    },
  })
}

export async function updateSheet(sheetId: string, tabName: string, range: string, data: any) {
  const googleSheetClient = await getGoogleSheetClient();
  
  try {
    await googleSheetClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        majorDimension: "ROWS",
        values: data
      },
    })
  } catch (err) {
    console.log(err);
  }
}
