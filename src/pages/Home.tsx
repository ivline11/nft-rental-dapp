import { Theme, Card, Text, Flex, Grid, Button } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';
import { NFTCard } from '../components/NFTCard';

export function Home() {
  const { userNFTs, isLoadingUserNFTs } = useNFTRental();
  
  return (
    <Theme>
      <Card>
        <Flex direction="column" gap="3">
          <Text size="5" weight="bold">내 NFT 목록</Text>
          
          {isLoadingUserNFTs ? (
            <Text>NFT 로딩 중...</Text>
          ) : userNFTs && userNFTs.length > 0 ? (
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
              {userNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  id={nft.id || ''}
                  name={nft.name || '이름 없음'}
                  description={nft.description || ''}
                  imageUrl={''}
                />
              ))}
            </Grid>
          ) : (
            <Flex direction="column" gap="2" align="center" py="6">
              <Text>보유한 NFT가 없습니다.</Text>
              <Button onClick={() => window.location.hash = '#create'}>
                NFT 생성하기
              </Button>
            </Flex>
          )}
        </Flex>
      </Card>
    </Theme>
  );
}