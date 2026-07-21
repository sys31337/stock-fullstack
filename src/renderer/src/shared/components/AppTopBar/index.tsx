'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@web/shared/components/ui/popover'
import { Button } from '@web/shared/components/ui/button'
import languages from '@web/config/languages'
import Products from '@web/modules/Products'
import Receipt from '@web/modules/Receipt'
import AllReceiptBills from '@web/modules/Receipt/AllReceiptBills'
import { useLogout } from '@web/shared/hooks/useAuthentication'
import authService from '@web/shared/services/auth'
import i18next, { t } from 'i18next'
import { Fragment, useState, useRef, useCallback } from 'react'
import { AiOutlineClose, AiOutlineMore, AiOutlineDown, AiOutlinePoweroff, AiFillRightCircle } from 'react-icons/ai'
import { useNavigate } from 'react-router-dom'
import { cn } from '@web/shared/utils/cn'

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
  component?: JSX.Element;
}

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Stock',
    children: [
      {
        label: t('productsList'),
        subLabel: t('productsListSublabel'),
        href: 'products',
        component: <Products isTopBar />
      },
      {
        label: t('newReceiptBill'),
        subLabel: t('newReceiptBillLabel'),
        href: 'receipt',
        component: <Receipt isTopBar />
      },
      {
        label: t('allReceiptBill'),
        subLabel: t('allReceiptBillLabel'),
        href: 'receipt',
        component: <AllReceiptBills isTopBar />
      },
    ],
  },
]

const HoverPopover = ({ children, content, align = "center" }: { children: React.ReactNode; content: React.ReactNode; align?: "center" | "start" | "end" }) => {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="p-0 border border-border shadow-xl bg-popover text-popover-foreground rounded-xl w-auto"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

const Languages = ({ className }: { className?: string }) => (
  <div className={className}>
    <HoverPopover
      content={
        <div className="flex flex-col py-1.5">
          {languages.map(({ id, label, code }) => (
            <div
              key={id}
              role={'group'}
              className="flex items-center gap-3 p-2 px-3 mx-1.5 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => {
                i18next.changeLanguage(code);
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              }}
            >
              <img
                className="w-6 h-6 rounded-full ring-2 ring-border"
                src={`/assets/${code}.svg`}
                alt={label}
              />
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      }
    >
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
        {t('language')}
        <AiOutlineDown className="h-3 w-3" />
      </button>
    </HoverPopover>
  </div>
)

interface AppTopBarProps {
  children: JSX.Element | JSX.Element[];
}

const AppTopBar: React.FC<AppTopBarProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mutateAsync: logout } = useLogout();
  const navigate = useNavigate();

  const onToggle = () => setIsOpen(!isOpen);

  const onLogout = async () => {
    try {
      const { token } = authService.loadUserInfo() || { token: undefined };
      await logout(token as void);
      authService.resetUserInfo();
      navigate('/connexion');
    } catch (e) {
      authService.resetUserInfo();
      navigate('/connexion');
    }
  };

  return (
    <div className="w-full shrink-0">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 flex items-center px-4 sm:px-6">
        <div className="flex items-center md:hidden mr-2">
          <Button
            onClick={onToggle}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={'Toggle Navigation'}
          >
            {isOpen ? <AiOutlineClose className="h-4 w-4" /> : <AiOutlineMore className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center flex-1 mr-6">
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo-h.png" alt="SoluStock" className="h-12 rounded-lg object-contain" />
          </div>
        </div>

        <div className="hidden md:flex items-center flex-1 gap-0.5 mr-auto">
          <DesktopNav />
        </div>

        <div className="flex items-center gap-0.5 ml-auto">
          <Languages />
          <div className="w-px h-5 bg-border mx-1.5" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2.5"
          >
            <AiOutlinePoweroff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-sm">{t('logout')}</span>
          </Button>
        </div>
      </header>

      {/* Mobile Nav Collapse */}
      <div className={cn(
        "md:hidden overflow-hidden transition-all duration-200 ease-in-out border-b border-border bg-card",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-b-0"
      )}>
        <MobileNav />
      </div>

      {children}
    </div>
  )
}

const DesktopNav = () => {
  return (
    <>
      {NAV_ITEMS.map((navItem, k) => (
        <div key={k}>
          {navItem.children ? (
            <HoverPopover
              align="start"
              content={
                <div className="p-2 min-w-[320px]">
                  <div className="flex flex-col">
                    {navItem.children.map((child, k) => (
                      child.component ? (<Fragment key={k}>{child.component}</Fragment>) : <DesktopSubNav key={k} {...child} />
                    ))}
                  </div>
                </div>
              }
            >
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer">
                {navItem.label}
                <AiOutlineDown className="h-3 w-3 opacity-50" />
              </button>
            </HoverPopover>
          ) : (
            <a href={navItem.href} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
              {navItem.label}
            </a>
          )}
        </div>
      ))}
    </>
  )
}

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 p-2.5 px-3 rounded-lg hover:bg-accent transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium transition-colors group-hover:text-primary text-foreground truncate">
          {label}
        </p>
        {subLabel && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subLabel}</p>
        )}
      </div>
      <AiFillRightCircle className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
    </a>
  )
}

const MobileNav = () => {
  return (
    <div className="p-3 block md:hidden">
      {NAV_ITEMS.map((navItem, k) => (
        <MobileNavItem key={k} {...navItem} />
      ))}
    </div>
  )
}

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col" onClick={children && onToggle}>
      <div className="py-2 px-2 flex justify-between items-center hover:bg-accent rounded-lg cursor-pointer transition-colors">
        <a
          href={href ?? '#'}
          className="text-sm font-medium text-foreground"
          onClick={(e) => {
             if (children) {
                 e.preventDefault();
                 onToggle();
             }
          }}
        >
          {label}
        </a>
        {children && (
          <AiOutlineDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200 ease-in-out",
              isOpen ? "rotate-180" : ""
            )}
          />
        )}
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out pl-3 border-l-2 border-primary/20 ml-3",
        isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
      )}>
        <div className="flex flex-col items-start py-1">
          {children &&
            children.map((child, k) => (
              <a key={k} className="py-1.5 px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md block w-full transition-colors" href={child.href}>
                {child.label}
              </a>
            ))}
        </div>
      </div>
    </div>
  )
}

export default AppTopBar;
