import * as React from 'react'
import { Slot } from '@radix-ui/react-tabs'

const Tabs = React.forwardRef<React.ElementType, React.ComponentPropsWithoutRef<typeof Slot>>(({ className, ...props }, ref) => (
  <Slot ref={ref} className={`${className}`} {...props} />
))
Tabs.displayName = Slot.displayName

const TabsList = React.forwardRef<React.ElementType, React.ComponentPropsWithoutRef<typeof Slot>>(({ className, ...props }, ref) => (
  <Slot ref={ref} className={`${className} grid w-full grid-cols-2 border-b`} {...props} />
))
TabsList.displayName = Slot.displayName

const TabsTrigger = React.forwardRef<React.ElementType, React.ComponentPropsWithoutRef<typeof Slot>>(({ className, ...props }, ref) => (
  <Slot
    ref={ref}
    className={`
      inline-flex h-10 items-center justify-center rounded-sm text-sm font-medium border-b-2
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      data-[state=active]:border-primary data-[state=active]:text-primary
      ${className}
    `}
    {...props}
  />
))
TabsTrigger.displayName = Slot.displayName

const TabsContent = React.forwardRef<React.ElementType, React.ComponentPropsWithoutRef<typeof Slot>>(({ className, ...props }, ref) => (
  <Slot ref={ref} className={`${className} mt-6`} {...props} />
))
TabsContent.displayName = Slot.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
