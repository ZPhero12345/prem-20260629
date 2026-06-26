import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#afc6ff',
            colorSuccess: '#6de039',
            colorError: '#ffb4ab',
            colorWarning: '#ffb3ae',
            colorBgBase: '#131313',
            colorBgContainer: '#1c1b1b',
            colorTextBase: '#e5e2e1',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            borderRadius: 4,
          },
          components: {
            Card: {
              borderRadiusLG: 8,
              colorBgContainer: '#1c1b1b',
              colorBorderSecondary: '#303030',
            },
            Button: {
              borderRadius: 4,
            },
            Input: {
              borderRadius: 4,
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)

