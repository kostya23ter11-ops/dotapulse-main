declare module 'openid' {
  export interface OpenIdAssertionResult {
    authenticated: boolean;
    claimedIdentifier: string;
  }

  export class RelyingParty {
    constructor(
      returnUrl: string,
      realm: string,
      stateless: boolean,
      strict: boolean,
      extensions: unknown[],
    );
    authenticate(
      identifier: string,
      immediate: boolean,
      callback: (error: Error | null, authUrl: string | null) => void,
    ): void;
    verifyAssertion(
      url: string,
      callback: (error: Error | null, result: OpenIdAssertionResult) => void,
    ): void;
  }
}