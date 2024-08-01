import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

/*****************
 * 全体のテーマを設定
 *****************
 */
// フォントを設定
const fontFamily = [
  'BIZ UDPゴシック',
  'BIZ UDゴシック',
  'Noto Sans JP',
  'メイリオ',
  'ＭＳ Ｐゴシック',
  'sans-serif',
].join(',');

const theme = createTheme({
  typography: {
    fontFamily: fontFamily, // フォント
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
