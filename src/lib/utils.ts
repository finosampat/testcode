import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about the Material 3 type scale so `text-label-large`
// is treated as a font-size (and not a color that clashes with `text-primary`).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-small',
            'headline-small',
            'title-large',
            'title-medium',
            'title-small',
            'body-large',
            'body-medium',
            'body-small',
            'label-large',
            'label-medium',
            'label-small',
          ],
        },
      ],
      shadow: [{ shadow: ['elevation-1', 'elevation-2', 'elevation-3', 'elevation-4'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
