"use client";

import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const drawerContentVariants = cva("fixed z-50 flex bg-[linear-gradient(180deg,#fffaf3_0%,#f8f1e5_100%)] shadow-2xl outline-none", {
  variants: {
    direction: {
      top: "inset-x-0 top-0 flex-col border-b border-border/70",
      bottom: "inset-x-0 bottom-0 flex-col border-t border-border/70",
      left: "inset-y-0 left-0 h-full w-full max-w-xl flex-col border-r border-border/70",
      right: "inset-y-0 right-0 h-full w-full max-w-xl flex-col border-l border-border/70",
    },
  },
  defaultVariants: {
    direction: "bottom",
  },
});

function Drawer({ shouldScaleBackground = false, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />;
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close {...props} />;
}

const DrawerOverlay = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/25 backdrop-blur-sm", className)}
    {...props}
  />
));

DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & VariantProps<typeof drawerContentVariants>
>(({ className, children, direction, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(drawerContentVariants({ direction }), className)}
      {...props}
    >
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));

DrawerContent.displayName = DrawerPrimitive.Content.displayName;

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}

const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn("font-heading text-2xl font-medium text-foreground", className)} {...props} />
));

DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
));

DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};