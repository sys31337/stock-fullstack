import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react'
import Card from './components/Card';
import { modules } from './helpers/modules';
import cacheService from '@shared/services/cache';
import { t } from 'i18next';
import Receipt from '@modules/Receipt';

const Home = () => {
  const userInfo = cacheService.get('USER_INFO_KEY') as { fullname: string };
  const { fullname } = userInfo;

  return (
    <Box p={4}>
      <Stack spacing={4} as={Container} maxW={'6xl'} textAlign={'center'}>
        <Heading fontSize={{ base: '2xl', sm: '4xl' }} fontWeight={'bold'} color={'gray.900'}>
          {t('welcomeUser', { fullname })}
        </Heading>
      </Stack>

      <Container maxW={'8xl'} mt={12}>
        <SimpleGrid columns={4} spacing={10}>
          <Receipt />
          {modules.map(({ label, icon, href, keyBind, bg }, key) => (
            <Card
              key={key}
              label={label}
              keyBind={keyBind}
              icon={icon}
              href={href}
              bg={bg}
            />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}

export default Home;
