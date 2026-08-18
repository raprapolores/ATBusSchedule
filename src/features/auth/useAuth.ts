import { useState } from 'react';

export type NativeAccount = {
  name?: string;
  username?: string;
  localAccountId?: string;
  idTokenClaims?: {
    oid?: string;
    preferred_username?: string;
  };
};

export function useAuth() {
  const [account, setAccount] = useState<NativeAccount | null>(null);

  const login = async () => {
    setAccount({
      name: 'Demo User',
      username: 'demo.user@athop.com',
      localAccountId: 'demo-user-id',
      idTokenClaims: {
        oid: 'demo-user-id',
        preferred_username: 'demo.user@athop.com',
      },
    });
  };

  const getToken = async () => ({
    accessToken: 'demo-access-token',
    expiresOn: Date.now() + 60 * 60 * 1000,
  });

  const logout = async () => {
    setAccount(null);
  };

  return {
    login,
    getToken,
    logout,
    account,
  };
}
