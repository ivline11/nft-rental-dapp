import { Theme, Container, Flex, Heading, Box, Tabs } from '@radix-ui/themes';
import { ConnectButton, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { CreateNFT } from './pages/CreateNFT';
import { KioskSetup } from './pages/KioskSetup';
import { ListNFT } from './pages/ListNFT';
import { RentNFT } from './pages/RentNFT';
import { ReturnNFT } from './pages/ReturnNFT';
import { KioskNFTs } from './pages/KioskNFTs';
import { useState } from 'react';
import { NFTList } from './pages/NFTList';

// 네트워크 설정
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
};

// React Query 클라이언트 생성
const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider>
          <Theme appearance="dark">
            <Container size="3">
              <Flex direction="column" gap="4" py="4">
                <Flex justify="between" align="center">
                  <Heading size="8">NFT 대여 플랫폼</Heading>
                  <ConnectButton />
                </Flex>
                
                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List>
                    <Tabs.Trigger value="home">내 NFT</Tabs.Trigger>
                    <Tabs.Trigger value="nftlist">NFT 목록</Tabs.Trigger>
                    <Tabs.Trigger value="create">NFT 생성</Tabs.Trigger>
                    <Tabs.Trigger value="kiosk">Kiosk 설정</Tabs.Trigger>
                    <Tabs.Trigger value="list">NFT 대여 등록</Tabs.Trigger>
                    <Tabs.Trigger value="rent">NFT 대여</Tabs.Trigger>
                    <Tabs.Trigger value="return">NFT 반환</Tabs.Trigger>
                    <Tabs.Trigger value="kioskNFTs">Kiosk NFT</Tabs.Trigger>
                  </Tabs.List>
                  
                  <Box py="4">
                    {activeTab === 'home' && <Home />}
                    {activeTab === 'nftlist' && <NFTList />}
                    {activeTab === 'create' && <CreateNFT />}
                    {activeTab === 'kiosk' && <KioskSetup />}
                    {activeTab === 'list' && <ListNFT />}
                    {activeTab === 'rent' && <RentNFT />}
                    {activeTab === 'return' && <ReturnNFT />}
                    {activeTab === 'kioskNFTs' && <KioskNFTs />}
                  </Box>
                </Tabs.Root>
              </Flex>
            </Container>
          </Theme>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
