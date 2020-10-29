import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

import AWS, { CognitoIdentityServiceProvider } from "aws-sdk";

export class Auth {
  private readonly regionId: string;
  private readonly userPoolId: string;
  private readonly identityPoolId: string;
  private readonly userPool: CognitoUserPool;
  private readonly identityServerProvider: CognitoIdentityServiceProvider;
  constructor() {
    this.userPoolId = process.env.USER_POOL_ID;
    this.identityServerProvider = new CognitoIdentityServiceProvider();
    this.regionId = process.env.REGION_ID;
    this.identityPoolId = process.env.IDENTITY_POOL_ID;
    this.userPool = new CognitoUserPool({
      UserPoolId: this.userPoolId,
      ClientId: process.env.APP_CLIENT_ID,
    });
  }

  public authenticate = async (
    username: string,
    password: string
  ): Promise<any> => {
    const user = this.getUser(username);
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });
    return new Promise((resolve, reject) => {
      return user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          resolve(this.getUserToken(result));
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    }).catch((error) => {
      throw Error(error);
    });
  };

  public confirmRegister = async (
    username: string,
    code: string
  ): Promise<any> => {
    const user = this.getUser(username);
    return new Promise((resolve, reject) => {
      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    }).catch((error) => {
      throw Error(error);
    });
  };

  public register = async (
    username: string,
    password: string,
    documentNumber: string,
    phoneNumber: string
  ): Promise<any> => {
    const attributes = [
      this.createAttribute("phone_number", phoneNumber),
      this.createAttribute("custom:document_number", documentNumber),
    ];
    console.log("attributes: ", attributes);
    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        username,
        password,
        attributes,
        null,
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );
    }).catch((error) => {
      console.log(error);
      throw Error(error);
    });
  };

  private createAttribute = (name: string, value: string) => {
    return new CognitoUserAttribute({ Name: name, Value: value });
  };

  public getAwsCredentials = (idToken: string): Promise<void> => {
    const authenticator = `cognito-idp.${this.regionId}.amazonaws.com/${this.userPoolId}`;
    console.log("authenticator: ", authenticator);
    console.log("identity pool id:", this.identityPoolId);
    AWS.config.update({ region: this.regionId });
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.identityPoolId,
      Logins: {
        [authenticator]: idToken,
      },
    });
    console.log("credentials: ", AWS.config.getCredentials);
    return (<AWS.CognitoIdentityCredentials>(
      AWS.config.credentials
    )).getPromise();
  };

  private getUserToken = (
    session: CognitoUserSession
  ): { accessToken: string; idToken: string; refreshToken: string } => {
    return {
      accessToken: session.getAccessToken().getJwtToken(),
      idToken: session.getIdToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken(),
    };
  };

  private getUser = (username: string) => {
    return new CognitoUser({ Username: username, Pool: this.userPool });
  };

  public addUserToGroup = async (
    username: string,
    groupName: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const params = {
        GroupName: groupName,
        UserPoolId: this.userPoolId,
        Username: username,
      };

      this.identityServerProvider.adminAddUserToGroup(params, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  };
}
