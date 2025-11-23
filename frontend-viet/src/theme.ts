import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    // Vietnamese theme colors inspired by Vietnamese flag and culture
    brand: {
      50: '#fff5f5',  // Very light red
      100: '#fed7d7', // Light red
      200: '#feb2b2', // Medium light red
      300: '#fc8181', // Medium red
      400: '#f56565', // Red
      500: '#e53e3e', // Main Vietnamese red
      600: '#c53030', // Dark red
      700: '#9b2c2c', // Darker red
      800: '#742a2a', // Very dark red
      900: '#500000', // Deepest red
    },
    yellow: {
      50: '#fffbf0',  // Very light yellow
      100: '#fef5e7', // Light yellow
      200: '#fdebc9', // Medium light yellow
      300: '#fbd38d', // Medium yellow
      400: '#f6ad55', // Yellow
      500: '#ed8936', // Main Vietnamese yellow/orange
      600: '#dd6b20', // Dark yellow
      700: '#c05621', // Darker yellow
      800: '#9c4221', // Very dark yellow
      900: '#7b341e', // Deepest yellow
    },
    green: {
      50: '#f0fff4',
      100: '#c6f6d5',
      200: '#9ae6b4',
      300: '#68d391',
      400: '#48bb78',
      500: '#38a169',
      600: '#2f855a',
      700: '#276749',
      800: '#22543d',
      900: '#1c4532',
    },
    gold: {
      50: '#fffaf0',
      100: '#fef1d9',
      200: '#fde2a3',
      300: '#fcc96b',
      400: '#fab636',
      500: '#f7a500', // Vietnamese gold
      600: '#e69500',
      700: '#cc8400',
      800: '#b37300',
      900: '#996200',
    },
    gray: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    }
  },
  fonts: {
    heading: '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'lg',
      },
      sizes: {
        lg: {
          h: '12',
          px: '8',
          fontSize: 'md',
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
            borderColor: 'brand.600',
          },
        },
        ghost: {
          color: 'brand.600',
          _hover: {
            bg: 'brand.50',
          },
        },
        vietnamese: {
          bg: 'linear-gradient(135deg, #e53e3e 0%, #f7a500 100%)', // Red to gold gradient
          color: 'white',
          fontWeight: 'bold',
          _hover: {
            bg: 'linear-gradient(135deg, #c53030 0%, #e69500 100%)',
            transform: 'translateY(-2px)',
            boxShadow: 'xl',
          },
          _active: {
            bg: 'linear-gradient(135deg, #9b2c2c 0%, #cc8400 100%)',
          },
        }
      },
    },
    Card: {
      variants: {
        outline: {
          container: {
            borderColor: 'brand.200',
            borderWidth: '1px',
            _hover: {
              borderColor: 'brand.300',
              boxShadow: 'md',
            },
          },
        },
        vietnamese: {
          container: {
            bg: 'white',
            border: '2px solid',
            borderColor: 'brand.200',
            borderRadius: 'xl',
            overflow: 'hidden',
            _hover: {
              borderColor: 'brand.400',
              boxShadow: '0 8px 25px rgba(229, 62, 62, 0.15)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'brand.200',
            _hover: {
              borderColor: 'brand.300',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px #e53e3e',
            },
          },
        },
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            borderColor: 'brand.200',
            _hover: {
              borderColor: 'brand.300',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px #e53e3e',
            },
          },
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
        fontSize: 'md',
        fontWeight: '400',
      },
    },
  },
});

export default theme;