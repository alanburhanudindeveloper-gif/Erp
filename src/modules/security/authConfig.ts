export const ERP_AUTH_SECRET_ENV_NAME = 'ERP_AUTH_SECRET';

export function getErpAuthSecret(): string {
  const secret = process.env.ERP_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error('ERP_AUTH_SECRET is required. Set ERP_AUTH_SECRET in the environment before starting the ERP server.');
  }

  if (secret.length < 32) {
    throw new Error('ERP_AUTH_SECRET must be at least 32 characters long.');
  }

  return secret;
}

export function assertErpAuthSecretConfigured(): string {
  return getErpAuthSecret();
}
