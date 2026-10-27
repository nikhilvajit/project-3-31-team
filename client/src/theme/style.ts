import { SxProps } from '@mui/material/styles';
import { maxHeight } from '@mui/system';

export const commonStyles = {
  // Layout
  pageContainer: {
    minHeight: '100vh',
    bgcolor: 'background.default',
    display: 'flex',
    flexDirection: 'column',
  } satisfies SxProps,

  mainContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 3,
    p: 4,
    maxWidth: '120rem',
    mx: 'auto',
    width: '100%',
  } satisfies SxProps,

  menuContainer: {
    width: '64rem',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 8rem)',
  } satisfies SxProps,

  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 2,
  } satisfies SxProps,

  // Images and specific elements
  logo: {
    height: '3rem',
    width: 'auto',
  } as const,

  itemImage: {
    width: '100%',
    maxHeight: '8rem',
    objectFit: 'cover',
    borderRadius: '0.375rem',
    marginBottom: '0.5rem',
  } as const,

  actionButtons: {
    mt: 2,
    display: 'flex',
    gap: 2,
    bgcolor: 'background.default',
    py: 2,
  } satisfies SxProps,
} as const;