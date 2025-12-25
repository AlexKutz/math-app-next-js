'use client';

import { LoginButton } from '../auth/LoginButton';
import { SignOutButton } from '../auth/LogoutButton';

type Props = {
  isAuthenticated: boolean;
};

export const AuthControls = ({ isAuthenticated }: Props) => {
  return isAuthenticated ? <SignOutButton /> : <LoginButton />;
};
