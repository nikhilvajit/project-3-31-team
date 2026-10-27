import { SxProps } from '@mui/material/styles';

export const componentStyles = {
  categoryButton: {
    height: '12rem',
    display: 'flex',
    flexDirection: 'column',
    bgcolor: '#CC473E',
    color: 'primary.contrastText',
    '&:hover': {
      bgcolor: '#A1332B',
    },
  } satisfies SxProps,

  itemButton: {
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    borderRadius: 2,
    '&.selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '&:hover': {
        bgcolor: 'rgb(6, 70, 122)',
      },
    },
    '&:not(.selected):hover': {
      bgcolor: 'rgb(36, 151, 245)',
    },
  } satisfies SxProps,

  cartCard: {
    width: '24rem',
    height: 'fit-content',
  } satisfies SxProps,

  menuCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } satisfies SxProps,

  menuContent: {
    flex: 1,
    overflow: 'auto',
    p: 2,
    '&:last-child': {
      pb: 2,
    },
  } satisfies SxProps,
};