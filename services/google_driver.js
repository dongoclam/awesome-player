require("dotenv").config();
const fs = require("fs");
const readline = require("readline");
const google = require("googleapis").google;

class GoogleDriver {
  async authorize() {
    if(this.token) return;
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.DRIVER_CLIENT_ID,
      process.env.DRIVER_CLIENT_SECRET,
      process.env.DRIVER_REDIRECT_URL
    );
    this.authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: GoogleDriver.options.scopes
    });
    this.token = await this.loadToken();
    this.oAuth2Client.setCredentials(this.token);
    this.drive = google.drive({
      version: "v3",
      auth: this.oAuth2Client
    });
  }

  loadToken() {
    if (fs.existsSync(GoogleDriver.options.tokenPath)) {
      return new Promise(resolve => {
        fs.readFile(GoogleDriver.options.tokenPath, (error, token) => {
          error ? resolve(null) : resolve(JSON.parse(token));
        });
      });
    } else {
      console.log("Authorize this app by visiting this url:", this.authUrl);
      const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      return new Promise(resolve => {
        readlineInterface.question("Enter the code: ", code => {
          this.oAuth2Client.getToken(code, (error, token) => {
            if (error) return console.error(error);
            fs.writeFile(
              GoogleDriver.options.tokenPath,
              JSON.stringify(token),
              error => {
                if (error) return console.log(error);
                console.log("Token stored to", GoogleDriver.options.tokenPath);
              }
            );
            resolve(token);
          });
          readlineInterface.close();
        });
      });
    }
  }

  async listFiles() {
    await this.authorize();
    return new Promise(resolve => {
      this.drive.files.list(GoogleDriver.options.listFiles, (error, res) => {
        if (error) return console.log(error.message);
        resolve(res.data.files);
      });
    });
  }
}

GoogleDriver.options = {
  scopes: ["https://www.googleapis.com/auth/drive"],
  tokenPath: "token.json",
  listFiles: {
    pageSize: 30,
    fields: "nextPageToken, files(id, name, size)"
  }
};

a = new GoogleDriver();

a.listFiles().then(files => console.log(files));
