import { useState } from 'react';
import { User } from '../types';
import { USERS } from '../constants';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (id: string, pass: string) => {
    const user = USERS.find(u => u.id === id && u.password === pass);
    if (user) {
      setCurrentUser(user);
      return true;
    } else {
      alert('등록된 사용자가 아닙니다.');
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return {
    currentUser,
    handleLogin,
    handleLogout,
  };
};
