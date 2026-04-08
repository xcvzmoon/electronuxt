export default defineAppConfig({
  ui: {
    colors: {
      primary: 'purple',
      neutral: 'zinc',
    },

    icons: {
      loading: 'i-lucide-loader',
    },

    button: {
      slots: {
        base: ['cursor-pointer'],
      },
      variants: {
        size: {
          xs: {
            leadingIcon: 'size-2',
            trailingIcon: 'size-2',
          },
          sm: {
            leadingIcon: 'size-3',
            trailingIcon: 'size-3',
          },
          md: {
            leadingIcon: 'size-4',
            trailingIcon: 'size-4',
          },
          lg: {
            leadingIcon: 'size-5',
            trailingIcon: 'size-5',
          },
          xl: {
            leadingIcon: 'size-6',
            trailingIcon: 'size-6',
          },
        },
      },
    },
  },
});
