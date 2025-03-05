import { useState } from 'react';
import { Theme, Card, Text, Flex, TextField, Button } from '@radix-ui/themes';
import { useNFTRental } from '../hooks/useNFTRental';

type RentalFormProps = {
  nftId: string;
  onSuccess?: () => void;
};

export function RentalForm({ nftId, onSuccess }: RentalFormProps) {
  const [duration, setDuration] = useState('7');
  const [pricePerDay, setPricePerDay] = useState('1');
  const { listNFTForRent } = useNFTRental();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await listNFTForRent.mutateAsync({
        nftId,
        duration: parseInt(duration),
        pricePerDay: parseInt(pricePerDay),
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('NFT 대여 등록 실패:', error);
    }
  };
  
  return (
    <Theme>
      <Card>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">NFT 대여 등록</Text>
            
            <Flex direction="column" gap="1">
              <Text size="2">대여 기간 (일)</Text>
              <TextField.Root
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </Flex>
            
            <Flex direction="column" gap="1">
              <Text size="2">일일 대여 가격 (SUI)</Text>
              <TextField.Root
                type="number"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                min="0.1"
                step="0.1"
              />
            </Flex>
            
            <Button type="submit" disabled={listNFTForRent.isPending}>
              {listNFTForRent.isPending ? '처리 중...' : '대여 등록하기'}
            </Button>
          </Flex>
        </form>
      </Card>
    </Theme>
  );
} 