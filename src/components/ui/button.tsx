import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Material 3 buttons: fully rounded, 40dp tall, label-large type, 8%/12% state layers.
const buttonVariants = cva(
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full text-label-large transition-[background-color,box-shadow,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:shadow-elevation-1 hover:bg-primary/90 active:bg-primary/85',
        tonal: 'bg-secondary-container text-secondary-container-foreground hover:shadow-elevation-1 hover:bg-secondary-container/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-outline bg-transparent text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]',
        secondary: 'bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2 hover:bg-primary/[0.08]',
        ghost: 'text-on-surface-variant hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12]',
        text: 'text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6',
        sm: 'h-8 px-4 text-label-medium [&_svg]:size-4',
        lg: 'h-12 px-8',
        icon: 'size-10',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? type : (type ?? 'button')}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
