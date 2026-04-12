// Type shims for packages that don't ship their own declarations

declare module '@expo/vector-icons' {
  import { ComponentProps } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }

  export class Ionicons extends React.Component<IconProps> {}
  export class MaterialIcons extends React.Component<IconProps> {}
  export class MaterialCommunityIcons extends React.Component<IconProps> {}
  export class FontAwesome extends React.Component<IconProps> {}
  export class FontAwesome5 extends React.Component<IconProps> {}
  export class AntDesign extends React.Component<IconProps> {}
  export class Feather extends React.Component<IconProps> {}
  export class Entypo extends React.Component<IconProps> {}
}
