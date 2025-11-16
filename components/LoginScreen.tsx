import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (id: string, pass: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    onLogin(id, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-clinic-background">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <i className="fas fa-clinic-medical text-5xl text-clinic-primary"></i>
            <h1 className="mt-4 text-3xl font-bold text-clinic-primary">연이재한의원 관리</h1>
            <p className="mt-2 text-clinic-text-secondary">시스템 로그인</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="id" className="sr-only">아이디</label>
              <input
                id="id"
                name="id"
                type="text"
                autoComplete="username"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-clinic-secondary focus:border-clinic-secondary focus:z-10 sm:text-sm"
                placeholder="아이디"
              />
            </div>
            <div>
              <label htmlFor="password"className="sr-only">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-clinic-secondary focus:border-clinic-secondary focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-clinic-primary hover:bg-clinic-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinic-secondary transition-colors"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
