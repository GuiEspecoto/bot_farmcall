'use strict';

const {
  CredentialType,
  maskSecret
} = require('./credentialTypes');

class UserTokenSession {
  constructor() {
    this._token = null
    this._configuredAt = null;
  }

  setUserToken(value) {
    if (typeof value !== 'string') {
    }

    const token = value.trim();

    this._token = token;
    this._configuredAt = Date.now();

    return this.getStatus();
  }

  hasUserToken() {
    return (
      typeof this._token === 'string' &&
      this._token.length > 0
    );
  }

  getMaskedUserToken() {
    if (!this.hasUserToken()) {
      return null;
    }

    return maskSecret(this._token);
  }

  getCredentialType() {
    return CredentialType.USER_TOKEN;
  }

  getStatus() {
    return {
      type: CredentialType.USER_TOKEN,
      configured: this.hasUserToken(),
      maskedValue: this.getMaskedUserToken(),
      configuredAt: this._configuredAt
    };
  }

  getUserTokenForInternalUse() {
    if (!this.hasUserToken()) {
      return null;
    }

    return this._token;
  }

  clearUserToken() {
    if (this._token !== null) {
      this._token = null;
    }

    this._configuredAt = null;

    return this.getStatus();
  }

  toJSON() {
    return this.getStatus();
  }
}

module.exports = {
  UserTokenSession
};