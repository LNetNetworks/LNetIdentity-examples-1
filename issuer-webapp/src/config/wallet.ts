export const WALLET_CONFIG = {
  dwalletApiBaseUrl: import.meta.env.VITE_IDENTITY_API_BASE_URL || 'https://dev-identity-dwallet.l-net.io/wallet',
  ssiVcApiBaseUrl: import.meta.env.VITE_SSI_VC_API_BASE_URL || 'https://dev-identity-api.l-net.io/',
  ssiVcApiKey: '3af2fe9f6501a7ac4b06',
  ssiVcClaimsVerifier: '0xf61aA3e9Ff67c53Adc47f2c02dE7545aDfB9c0B4',
  legacyClaimsVerifier: '0xAa9f4b97789Aabcd4fD4f3dF35C2112B868c7471',
} as const;
