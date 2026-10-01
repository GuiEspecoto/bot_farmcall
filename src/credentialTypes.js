'use strict';

/*
============================================================
 FARM CALL - TIPOS DE CREDENCIAL
============================================================

Este módulo NÃO autentica nenhuma conta.

Ele apenas representa e diferencia:

1. EMAIL_PASSWORD
   Credenciais tradicionais de login.

2. USER_TOKEN
   Credencial de sessão de uma conta pessoal.

3. BOT_TOKEN
   Token de uma aplicação/bot criada no Discord Developer Portal.

Segredos nunca devem ser exibidos integralmente em logs.
============================================================
*/

const CredentialType = Object.freeze({
  EMAIL_PASSWORD: 'EMAIL_PASSWORD',
  USER_TOKEN: 'USER_TOKEN',
  BOT_TOKEN: 'BOT_TOKEN'
});

function isValidCredentialType(type) {
  return Object.values(CredentialType).includes(type);
}

function describeCredentialType(type) {
  switch (type) {
    case CredentialType.EMAIL_PASSWORD:
      return {
        type,
        name: 'E-mail + senha',
        description:
          'Credenciais tradicionais utilizadas pelo usuário durante o processo de login.',
        secret: true
      };

    case CredentialType.USER_TOKEN:
      return {
        type,
        name: 'User token',
        description:
          'Credencial interna de autenticação associada à sessão de uma conta pessoal.',
        secret: true
      };

    case CredentialType.BOT_TOKEN:
      return {
        type,
        name: 'Bot token',
        description:
          'Credencial de uma conta de bot criada através do Discord Developer Portal.',
        secret: true
      };

    default:
      throw new TypeError('Tipo de credencial inválido.');
  }
}

function maskSecret(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const secret = value.trim();

  if (!secret) {
    return '';
  }

  if (secret.length <= 8) {
    return '*'.repeat(secret.length);
  }

  return (
    secret.slice(0, 4) +
    '*'.repeat(Math.min(secret.length - 8, 20)) +
    secret.slice(-4)
  );
}

function createCredentialDescriptor({
  type,
  value,
  email
}) {
  if (!isValidCredentialType(type)) {
    throw new TypeError('Tipo de credencial inválido.');
  }

  const descriptor = {
    type,
    configured: false,
    maskedValue: null
  };

  if (type === CredentialType.EMAIL_PASSWORD) {
    descriptor.email =
      typeof email === 'string'
        ? email.trim()
        : '';

    descriptor.configured =
      descriptor.email.length > 0 &&
      typeof value === 'string' &&
      value.length > 0;

    descriptor.maskedValue =
      value
        ? maskSecret(value)
        : null;

    return descriptor;
  }

  descriptor.configured =
    typeof value === 'string' &&
    value.trim().length > 0;

  descriptor.maskedValue =
    descriptor.configured
      ? maskSecret(value)
      : null;

  return descriptor;
}

function safeCredentialLog(descriptor) {
  if (!descriptor || !isValidCredentialType(descriptor.type)) {
    throw new TypeError('Descritor de credencial inválido.');
  }

  return {
    type: descriptor.type,
    configured: Boolean(descriptor.configured),
    maskedValue: descriptor.maskedValue || null
  };
}

module.exports = {
  CredentialType,
  isValidCredentialType,
  describeCredentialType,
  maskSecret,
  createCredentialDescriptor,
  safeCredentialLog
};