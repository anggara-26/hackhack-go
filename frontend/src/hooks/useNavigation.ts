import { useNavigation as useReactNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

export const useNavigation = () => {
  return useReactNavigation<StackNavigationProp<RootStackParamList>>();
};
