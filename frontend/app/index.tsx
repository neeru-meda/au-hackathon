import React from 'react';
import { UserProvider } from './utils/UserContext';
import LoginScreen from './screens/LoginScreen';

export default function Index() {
  return (
    <UserProvider>
      <LoginScreen />
    </UserProvider>
  );
}
