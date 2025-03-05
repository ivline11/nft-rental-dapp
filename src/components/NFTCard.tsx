import { Theme, Card, Text, Flex, Box, Button } from '@radix-ui/themes';

type NFTCardProps = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isRentable?: boolean;
  isRented?: boolean;
  pricePerDay?: number;
  duration?: number;
  onRent?: () => void;
  onList?: () => void;
  onReturn?: () => void;
};

export function NFTCard({
  name,
  description,
  imageUrl,
  isRentable,
  isRented,
  pricePerDay,
  duration,
  onRent,
  onList,
  onReturn,
}: NFTCardProps) {
  return (
    <Theme>
      <Card style={{ maxWidth: 300 }}>
        <Flex direction="column" gap="2">
          <Box style={{ height: 200, overflow: 'hidden' }}>
            <img 
              src={imageUrl} 
              alt={name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </Box>
          <Text size="5" weight="bold">{name}</Text>
          <Text size="2" color="gray">{description}</Text>
          
          {isRentable && (
            <Flex direction="column" gap="1">
              <Text size="2">대여 가격: {pricePerDay} SUI / 일</Text>
              <Text size="2">대여 기간: {duration} 일</Text>
              <Button onClick={onRent}>대여하기</Button>
            </Flex>
          )}
          
          {isRented && (
            <Flex direction="column" gap="1">
              <Text size="2">대여 중</Text>
              <Button onClick={onReturn}>반환하기</Button>
            </Flex>
          )}
          
          {!isRentable && !isRented && (
            <Button onClick={onList}>대여 등록하기</Button>
          )}
        </Flex>
      </Card>
    </Theme>
  );
} 