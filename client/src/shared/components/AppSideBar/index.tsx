import React, { ReactNode } from 'react';
import {
  IconButton, Box, CloseButton, Flex, Icon, Drawer, DrawerContent, Text, useDisclosure, BoxProps, FlexProps,
  Button, Menu, MenuButton, MenuList, MenuItem, Image, HStack, Avatar, Progress,
} from '@chakra-ui/react';
import {
  FiHome, FiMenu, FiLogOut, FiChevronDown,
} from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import Logo from '@shared/icons/Logo';
import i18next, { t } from 'i18next';
import { useGetUserInfo, useLogout } from '@shared/hooks/useAuthentication';
import authService from '@shared/services/auth';
import { MdAdminPanelSettings } from 'react-icons/md';
import languages from '@config/languages';
import { BiCard, BiEdit, BiEuro } from 'react-icons/bi';
import Any from '@shared/types/any';

const assetsURL = import.meta.env.VITE_APP_ASSETS_URL;

interface LinkItemProps {
  name: string;
  icon: IconType;
  link: string;
}

const LinkItems: Array<LinkItemProps> = [
  { name: 'home', icon: FiHome, link: '/' },
  { name: 'my_cards', icon: BiCard, link: '/cards' },
  { name: 'pricing', icon: BiEuro, link: '/pricing' },
];

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: Any;
  link: string;
}
const NavItem = ({
  link, icon, children, ...rest
}: NavItemProps) => {
  const { pathname } = useLocation();
  return (
    <Link to={link}>
      <Flex
        align="center"
        p={{ base: 3, md: 4 }}
        mx="8"
        my={{ base: 1, md: 2 }}
        borderRadius={{ base: 'md', md: '2xl' }}
        role="group"
        color={pathname === link ? 'white' : 'theme.900'}
        bg={pathname === link ? 'theme.900' : 'white'}
        cursor="pointer"
        fontSize={{ base: 14, md: 16 }}
        _hover={{
          bg: 'theme.900',
          color: 'white',
        }}
        {...rest}>
        {icon && (
          <Icon
            mr="4"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}

const MobileNav = ({ onOpen, ...rest }: MobileProps) => (
  <Flex
    ml={{ base: 0, md: 60 }}
    px={{ base: 4, md: 4 }}
    display={{ base: 'flex', md: 'none' }}
    height="20"
    position={'fixed'}
    w={'full'}
    zIndex={99}
    alignItems="center"
    bg={'white'}
    borderBottomWidth="1px"
    boxShadow={'sm'}
    borderBottomColor={'white'}
    justifyContent={{ base: 'space-between', md: 'flex-end' }}
    {...rest}>
    <IconButton
      display={{ base: 'flex', md: 'none' }}
      onClick={onOpen}
      variant="ghost"
      color={'black'}
      aria-label="open menu"
      icon={<FiMenu />}
    />

    <Text
      display={{ base: 'flex', md: 'none' }}
      fontSize="2xl"
      fontFamily="monospace"
      fontWeight="bold">
      <Logo fill="black" width="90px" />
    </Text>
    <Box></Box>
  </Flex>
);

interface SidebarProps extends BoxProps {
  onClose: () => void;
  currentProfilePicture?: string;
}

const SidebarContent = ({ currentProfilePicture, onClose, ...rest }: SidebarProps) => {
  const { mutateAsync: logout } = useLogout();
  const navigate = useNavigate();

  const { data: user } = useGetUserInfo();

  const handleLogout = async () => {
    try {
      const { token } = authService.loadUserInfo() || { undefined };
      await logout(token as void);
      authService.resetUserInfo();
      navigate('/connexion');
    } catch (e) {
      authService.resetUserInfo();
      navigate('/connexion');
    }
  };

  const navItems = LinkItems;

  return (
    <Flex
      flexDirection='column'
      bg='white'
      w={{ base: 'full', md: 80 }}
      pos="fixed"
      h='full'
      justifyContent={'end'}
      boxShadow={'sm'}
      {...rest}>
      <Box flex={1}>
        <Flex h="20" alignItems="center" mx="8" pt={30} justifyContent="space-between">
          <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
            <Logo fill="black" width="80px" />
          </Text>
          <CloseButton display={{ base: 'flex', lg: 'none' }} color={'black'} _hover={{ bg: 'theme.900', color: 'white' }} onClick={onClose} />
        </Flex>
        {navItems.map((link, key) => (
          <NavItem key={key} icon={link.icon} link={link.link} onClick={onClose}>
            {t(link.name)}
          </NavItem>
        ))}
      </Box>
      <Box p='5'>
        <Box my={2} display={{ base: 'block', md: 'none' }}>
          <Menu>
            <MenuButton
              as={Button}
              color={'theme.900'}
              fontSize={'10pt'}
              fontWeight={500}
              w={'full'}
              rounded={'xl'}
              rightIcon={<FiChevronDown />}>
              {t('change_language')}
            </MenuButton>
            <MenuList borderRadius={25} border={'0'} bg={'theme.900'} w={'full'}>
              {languages.map(({ code, label, id }) => (
                <MenuItem minH='48px' bg={'theme.900'} borderRadius={25} key={id} minW="0" w={'250px'}>
                  <Flex
                    fontSize={14}
                    p={2}
                    _hover={{ bg: 'theme.800' }}
                    borderRadius={15}
                    w={'full'}
                    alignItems={'center'}
                    onClick={() => {
                      i18next.changeLanguage(code);
                      // eslint-disable-next-line no-restricted-globals
                      location.reload();
                    }}
                  >
                    <Image
                      boxSize='2rem'
                      borderRadius={'100'}
                      src={`/assets/${code}.svg`}
                      alt={label}
                      mr='12px'
                    />
                    <Text as={'span'} color={'white'}>{label}</Text>
                  </Flex>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Box>
        {
          user?.isAdmin && (
            <Button
              as={Link}
              to={'/admin'}
              onClick={onClose}
              display={{ base: 'none', md: 'flex' }}
              p={{ base: 2, md: 5 }}
              size={{ base: 'sm', md: 'md' }}
              mb={2}
              bg='green.500'
              color={'white'}
              _hover={
                {
                  bg: 'green.600',
                }
              }
              fontSize={{ base: '8pt', md: '10pt' }}
              fontWeight={300}
              w='full'
              rounded={'xl'}
              leftIcon={<MdAdminPanelSettings />}
            >
              {t('admin_control')}
            </Button>
          )
        }
        <Button
          bg='theme.200'
          onClick={handleLogout}
          fontSize={{ base: '8pt', md: '10pt' }}
          color={'red'}
          _hover={{
            color: 'white',
            bg: 'red.600',
          }}
          fontWeight={400}
          w='full'
          rounded={'xl'}
          leftIcon={<FiLogOut />}
        >
          {t('signout')}
        </Button>
      </Box>
      <Box bg={'white'} boxShadow={'0px 0px 20px 0 rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'} mx={5} mb={5} p={5} borderRadius={25}>
        <Flex alignItems={'center'} justifyContent={'space-between'} mb={2}>
          <Text color={'theme.900'} fontWeight={600}>{t('remaining_reviews')}</Text>
        </Flex>
        <Box>
          <Progress colorScheme={'blackAlpha'} value={user?.maxReviews} max={user?.totalReviews} borderRadius={25} />
          <Text color={'theme.100'} fontSize={'10pt'} fontWeight={'bold'} mt={2}>{`${user?.maxReviews}/${user?.totalReviews} ${t('answer')}`}</Text>
        </Box>
        <HStack mt={5}>
          <Avatar size={'md'} borderRadius={'2xl'} src={`${assetsURL}/profile_pictures/${currentProfilePicture}`} />
          <Flex
            alignItems="flex-start"
            flexDirection={'column'}
            ml="2">
            <Text fontSize="sm" color={'theme.900'}>{user?.fullname ? user?.fullname.substr(0, 15) : user?.username.substr(0, 15)}</Text>
            <Text fontSize="xs" color="gray.600">
              {user?.isAdmin ? 'Admin' : user?.business_name ? user?.business_name : t('user')}
            </Text>
          </Flex>
          <Box display={{ base: 'none', md: 'flex' }}>
            <FiChevronDown />
          </Box>
        </HStack>
        <Button
          as={Link}
          to={'/profile'}
          size={'sm'}
          w={'full'}
          mt={5}
          borderRadius={'full'}
          px={5}
          bg={'theme.900'}
          border={'2px solid'}
          borderColor={'theme.900'}
          color={'white'}
          _hover={{ bg: 'white', color: 'theme.900' }}
          fontWeight={500}
        >
          {t('edit')}&nbsp;<BiEdit />
        </Button>
      </Box>
    </Flex>
  );
};

const Header = ({ currentPageTitle, currentProfilePicture, onOpen }): Any => (
  <Flex
    px={{ base: 4, md: 4 }}
    display={{ base: 'none', md: 'flex' }}
    height="20"
    alignItems="center"
    bg={'white'}
    borderBottomWidth="1px"
    boxShadow={'sm'}
    borderBottomColor={'white'}
    justifyContent={'space-between'}>
    <IconButton
      display={{ base: 'flex', lg: 'none' }}
      onClick={onOpen}
      variant="ghost"
      color={'black'}
      aria-label="open menu"
      icon={<FiMenu />}
    />
    {currentPageTitle ? (
      <Text
        display={{ base: 'none', md: 'flex' }}
        flex={1}
        fontSize="2xl"
        color={'theme.900'}
        fontWeight="bold">
        {currentPageTitle}
      </Text>
    ) : (
      <Text
        display={{ base: 'none', md: 'flex' }}
        fontSize="2xl"
        color={'theme.900'}
        fontWeight="bold">
        vTap.io
      </Text>
    )}

    <HStack spacing={{ base: '0', md: '6' }} display={'flex'} justify={'space-between'}>
      <Flex alignItems={'center'}>
        <Menu>
          <Box
            py={2}
            transition="all 0.3s"
            _focus={{ boxShadow: 'none' }}>
            <Flex gap={5}>
              <Box my={2}>
                <Menu>
                  <MenuButton
                    as={Button}
                    color={'theme.900'}
                    fontSize={'10pt'}
                    fontWeight={500}
                    w={'full'}
                    rounded={'xl'}
                    rightIcon={<FiChevronDown />}>
                    {t('change_language')}
                  </MenuButton>
                  <MenuList borderRadius={25} border={'0'} bg={'theme.900'} w={'full'}>
                    {languages.map(({ code, label, id }) => (
                      <MenuItem minH='48px' bg={'theme.900'} borderRadius={25} key={id} minW="0" w={'250px'}>
                        <Flex
                          fontSize={14}
                          p={2}
                          _hover={{ bg: 'theme.800' }}
                          borderRadius={15}
                          w={'full'}
                          alignItems={'center'}
                          onClick={() => {
                            i18next.changeLanguage(code);
                            // eslint-disable-next-line no-restricted-globals
                            location.reload();
                          }}
                        >
                          <Image
                            boxSize='2rem'
                            borderRadius={'100'}
                            src={`/assets/${code}.svg`}
                            alt={label}
                            mr='12px'
                          />
                          <Text as={'span'} color={'white'}>{label}</Text>
                        </Flex>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </Box>
              <HStack>
                <Avatar size={'md'} borderRadius={'2xl'} src={`${assetsURL}/profile_pictures/${currentProfilePicture}`} />
                <Flex
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  flexDirection={'column'}
                  ml="2">
                  Text
                </Flex>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </Flex>
          </Box>
        </Menu>
      </Flex>
    </HStack>
  </Flex>
);

const AppSideBar = ({ currentPageTitle, currentProfilePicture, children }: { currentPageTitle?: string, currentProfilePicture?: string, children: ReactNode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box
      minH="100vh"
      minW="100vw"
      bg='white.900'
      overflowX={'hidden'}
    >
      <SidebarContent
        currentProfilePicture={currentProfilePicture}
        onClose={() => onClose}
        display={{ base: 'none', lg: 'flex' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent>
          <SidebarContent
            p={'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'}
            onClose={onClose}
            currentProfilePicture={currentProfilePicture}
          />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <Box
        bg={'white'}
        display={{ base: 'flex', md: 'none' }}
        position={'fixed'}
        w={'full'}
        zIndex={99}
        alignItems="center"
        borderBottomWidth="1px"
        boxShadow={'sm'}
        borderBottomColor={'white'}
        justifyContent={{ base: 'space-between', md: 'flex-end' }}
        h={'env(safe-area-inset-top)'}>
      </Box>

      <MobileNav
        bg={'white'}
        m={'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'}
        onOpen={onOpen}
      />
      <Box ms={{ base: 0, lg: 80 }} mt={{ base: '6rem', md: 0 }}>
        <Header currentPageTitle={currentPageTitle} onOpen={onOpen} currentProfilePicture={currentProfilePicture} />
        <Box
          p={'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'}
          margin={'auto'}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppSideBar;
