import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';
import FactCheckTwoToneIcon from '@mui/icons-material/FactCheckTwoTone';

// ----------------------------------------------------------------------

const icon_svg = (name: string) => (
  <SvgColor width="100%" height="100%" src={`/assets/icons/navbar/${name}.svg`} />
);

const icon = (Component: React.ElementType) => <Component sx={{ fontSize: 26 }} />;

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon_svg('ic-analytics'),
  },
  {
    title: 'User',
    path: '/user',
    icon: icon_svg('ic-user'),
  },
  {
    title: 'Product',
    path: '/products',
    icon: icon_svg('ic-cart'),
  },
  {
    title: 'Evaluation',
    path: '/eval',
//     icon: icon_svg('ic-blog'),
    icon: icon(FactCheckTwoToneIcon),
    info: (
      <Label color="error" variant="inverted">
        +1
      </Label>
    ),
  },
  {
    title: 'Sign in',
    path: '/sign-in',
    icon: icon_svg('ic-lock'),
  },
  {
    title: 'Not found',
    path: '/404',
    icon: icon_svg('ic-disabled'),
  },
];
