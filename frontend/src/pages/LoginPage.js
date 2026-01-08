import React from 'react';
import './LoginPage.css';

// 소셜 로그인 버튼의 링크는 백엔드 서버의 OAuth2 엔드포인트를 가리켜야 합니다.
const BACKEND_URL = 'http://localhost:8087';

const LoginPage = () => {
  return (
    <div className="login-page-container">
      <div className="login-modal">
        <h2>로그인</h2>

        <a className="social-login-btn naver" href={`${BACKEND_URL}/oauth2/authorization/naver`}>
          <img src="/images/naver.png" alt="네이버 로그인" />
          네이버 로그인
        </a>

        <a className="social-login-btn kakao" href={`${BACKEND_URL}/oauth2/authorization/kakao`}>
          <img src="/images/kakao.png" alt="카카오 로그인" />
          카카오 로그인
        </a>

        <a className="social-login-btn google" href={`${BACKEND_URL}/oauth2/authorization/google`}>
          <img src="/images/google.png" alt="구글 로그인" />
          구글 로그인
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
